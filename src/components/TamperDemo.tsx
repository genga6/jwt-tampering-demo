/**
 * デモ1: 盗んだ「署名付き」JWT を alg:none に格下げして改ざんする(OWASP 掲載の手口)。
 *
 * 1. サーバーが HS256 で署名した正規トークンを自動発行(= 攻撃者が盗んだ想定)
 * 2. 鍵なしで Base64url をデコード(header も payload も丸見え)
 * 3. header の alg を HS256 -> none に書き換え、payload を改ざん、署名を削除
 *    (あるいは署名をそのまま流用して payload だけ差し替え)
 * 4. 「検証しないサーバー」は通り、「署名検証するサーバー」は弾く
 */
import { type ReactNode, useEffect, useMemo, useState } from "react"
import { base64urlEncodeJson } from "../lib/base64url.js"
import { type VerifyResult, signHS256, verifyHS256 } from "../lib/jose-crypto.js"
import { type JwtClaims, type JwtHeader, decodeWithoutVerification } from "../lib/jwt.js"
import { Button, CodePanel, DemoCard, JwtWire, StatusBadge } from "./ui.js"

/** サーバーだけが知るシークレット。攻撃者はこれを持っていない。 */
const SERVER_SECRET = "server-only-hmac-secret-do-not-leak"

/** 改ざん手口。none = alg を none に格下げして署名削除 / keepSig = 元の署名を流用。 */
type AttackMode = "none" | "keepSig"

export function TamperDemo() {
  const [stolenToken, setStolenToken] = useState("")
  const [header0, setHeader0] = useState<JwtHeader | null>(null)
  const [sig0, setSig0] = useState("")
  const [payloadText, setPayloadText] = useState("")
  const [mode, setMode] = useState<AttackMode>("none")
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [busy, setBusy] = useState(false)

  // マウント時に「盗まれる正規トークン」を1つ自動発行する。
  useEffect(() => {
    void issueToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function issueToken() {
    setBusy(true)
    try {
      const token = await signHS256(
        { sub: crypto.randomUUID(), name: "Alice", role: "user" },
        SERVER_SECRET,
      )
      const decoded = decodeWithoutVerification(token)
      setStolenToken(token)
      setHeader0(decoded.header)
      setSig0(decoded.signature)
      setPayloadText(JSON.stringify(decoded.payload, null, 2))
    } finally {
      setBusy(false)
    }
  }

  // 改ざんトークンを組み立てる(鍵は不要 — Base64url を書き換えるだけ)。
  const { forged, forgedHeader, parsedRole, parseError } = useMemo(() => {
    if (!header0) {
      return { forged: "", forgedHeader: null, parsedRole: undefined, parseError: null }
    }
    try {
      const payload = JSON.parse(payloadText) as JwtClaims
      const encPayload = base64urlEncodeJson(payload)
      // 手口A: header の alg を none に書き換え、署名部を削除する。
      // 手口B: header も署名もそのまま、payload だけ差し替える。
      const header = mode === "none" ? { ...header0, alg: "none" } : header0
      const signature = mode === "none" ? "" : sig0
      const token = `${base64urlEncodeJson(header)}.${encPayload}.${signature}`
      return { forged: token, forgedHeader: header, parsedRole: payload.role, parseError: null }
    } catch (e) {
      return {
        forged: "",
        forgedHeader: null,
        parsedRole: undefined,
        parseError: e instanceof Error ? e.message : String(e),
      }
    }
  }, [header0, sig0, payloadText, mode])

  // 「署名検証するサーバー」が改ざんトークンをどう扱うかを都度確認する。
  useEffect(() => {
    if (!forged) {
      setVerifyResult(null)
      return
    }
    let alive = true
    verifyHS256(forged, SERVER_SECRET).then((r) => {
      if (alive) setVerifyResult(r)
    })
    return () => {
      alive = false
    }
  }, [forged])

  function escalate() {
    try {
      const payload = JSON.parse(payloadText) as JwtClaims
      setPayloadText(JSON.stringify({ ...payload, role: "admin" }, null, 2))
    } catch {
      /* JSON が壊れている間は無視 */
    }
  }

  const naiveAccepts = parsedRole === "admin"

  return (
    <DemoCard
      step="デモ 1"
      title="盗んだ JWT を alg:none に格下げして改ざん（よくある手口）"
      subtitle={
        <>
          header も payload も Base64url で書かれているだけ。攻撃者は
          <strong className="text-slate-200"> header の alg を HS256 → none に書き換え</strong>
          、payload を改ざんし、署名を捨てて送り直す。検証が甘いサーバーはこれを受理してしまう。
        </>
      }
    >
      {/* ① 盗んだトークン */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            ① 盗んだ正規トークン（サーバーが HS256 で署名・攻撃者は鍵を持たない）
          </span>
          <Button onClick={() => void issueToken()} tone="default" disabled={busy}>
            {busy ? "発行中…" : "別のトークンを再発行"}
          </Button>
        </div>
        {stolenToken ? (
          <JwtWire token={stolenToken} />
        ) : (
          <p className="text-sm text-slate-500">—</p>
        )}
      </div>

      {/* ② デコード + payload 編集 */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ② payload を書き換える（鍵不要）
            </span>
            <Button onClick={escalate} tone="danger">
              role を admin に昇格
            </Button>
          </div>
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full rounded-lg bg-slate-950/70 p-3 font-mono text-[13px] text-sky-200 ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {parseError && <p className="text-sm text-rose-400">JSON エラー: {parseError}</p>}
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              ③ 手口を選ぶ
            </div>
            <div className="inline-flex rounded-lg bg-slate-950/70 p-1 ring-1 ring-slate-700">
              <ModeTab active={mode === "none"} onClick={() => setMode("none")}>
                alg を none に格下げ
              </ModeTab>
              <ModeTab active={mode === "keepSig"} onClick={() => setMode("keepSig")}>
                署名を流用
              </ModeTab>
            </div>
          </div>
          <CodePanel
            label="改ざん後の header（alg に注目）"
            value={forgedHeader ? JSON.stringify(forgedHeader, null, 2) : "—"}
          />
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              再構成した改ざんトークン
            </div>
            {forged ? <JwtWire token={forged} /> : <p className="text-sm text-slate-500">—</p>}
          </div>
        </div>
      </div>

      {/* ④ サーバー2種の対比 */}
      <div className="mt-6 grid gap-3 border-t border-slate-700/60 pt-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800">
          <div className="text-xs font-semibold text-slate-400">
            検証しないサーバー（decode だけで payload を信用）
          </div>
          <StatusBadge ok={!naiveAccepts}>
            {naiveAccepts
              ? "role=admin を受理 → 権限昇格が成立"
              : `role=${String(parsedRole)}（まだ昇格していない）`}
          </StatusBadge>
        </div>
        <div className="space-y-2 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800">
          <div className="text-xs font-semibold text-slate-400">
            署名検証するサーバー（jose で検証）
          </div>
          <StatusBadge ok={verifyResult?.valid ?? false}>
            {verifyResult
              ? verifyResult.valid
                ? `検証OK（改ざんなし）role=${String(verifyResult.payload?.role)}`
                : "改ざんを検出 → 拒否"
              : "—"}
          </StatusBadge>
        </div>
      </div>

      <div className="mt-4">
        <CodePanel
          label="なぜ改ざんトークンが通ってしまうのか（サーバー側のよくある穴）"
          value={
            "・alg:none を受理してしまう（署名なしを有効と見なす）\n" +
            "・そもそも署名を検証していない（decode の結果を認可に使う）\n" +
            "・alg 混同 (RS256→HS256) で公開鍵を HMAC 鍵にされ署名を偽造される\n" +
            "・HMAC シークレットが弱く、総当り/辞書で割られる\n" +
            "→ 対策: alg を allowlist で固定し none を禁止、強い鍵で必ず署名検証する（デモ2・3）。"
          }
        />
      </div>
    </DemoCard>
  )
}

/** 改ざん手口の切り替えタブ。 */
function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-indigo-500/70 text-indigo-50" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  )
}
