/**
 * JWT 改ざんデモ（保護方式セレクタ統合版）。
 *
 * 「同じ改ざん（role: user → admin）」を、サーバーの署名方式ごとに検証する:
 *   - なし (alg:none): 署名を検証しない/none を許容 → 改ざんを検出できない (×)
 *   - HS256 (対称鍵): 共有シークレットの HMAC → 検出できる (〇)
 *   - RS256 (非対称鍵): 秘密鍵で署名・公開鍵で検証 → 検出できる (〇)
 *
 * 署名/検証/鍵生成はすべてブラウザの Web Crypto 上(jose)で実行する。
 */
import { useEffect, useState } from "react"
import {
  type RsaKeyPair,
  generateRs256KeyPair,
  signHS256,
  signRS256,
  verifyHS256,
  verifyRS256,
} from "../lib/jose-crypto.js"
import { buildUnsignedToken, tamperClaims } from "../lib/jwt.js"
import { Button, CodePanel, JwtWire, StepLabel, VerdictRow } from "./ui.js"

type Mode = "none" | "HS256" | "RS256"

const MODES: { key: Mode; label: string }[] = [
  { key: "none", label: "なし (alg:none)" },
  { key: "HS256", label: "HS256 (対称鍵)" },
  { key: "RS256", label: "RS256 (公開鍵)" },
]

const BASE_PAYLOAD = { sub: "1234567890", name: "Alice", role: "user" }

const NOTES: Record<Mode, string> = {
  none:
    "alg:none を許容する（または署名を検証しない）サーバーは、改ざんを検出できない。\n" +
    "攻撃者は署名付きトークンを alg:none に格下げしてこの状態を作り出す。\n" +
    "対策: alg を allowlist で固定して none を禁止し、必ず署名検証する。",
  HS256:
    "共有シークレットの HMAC で署名。payload を書き換えると HMAC が一致せず検出できる。\n" +
    "ただし検証側とシークレットを共有する必要があり、鍵が漏れると偽造も可能になる。",
  RS256:
    "秘密鍵で署名し、公開鍵で検証する。公開鍵を配っても秘密鍵なしには偽造できない。\n" +
    "第三者やマイクロサービスへ JWT を配布する用途に向く。",
}

interface DemoState {
  issued: string
  forged: string
  legitOk: boolean
  tamperedDetected: boolean
}

export function JwtDemo() {
  const [mode, setMode] = useState<Mode>("none")
  const [secret, setSecret] = useState("super-secret-shared-key")
  const [keys, setKeys] = useState<RsaKeyPair | null>(null)
  const [keyBusy, setKeyBusy] = useState(false)
  const [state, setState] = useState<DemoState | null>(null)

  // RS256 を選んだら鍵ペアを自動生成する（未生成のときだけ）。
  useEffect(() => {
    if (mode !== "RS256" || keys || keyBusy) return
    setKeyBusy(true)
    generateRs256KeyPair()
      .then(setKeys)
      .finally(() => setKeyBusy(false))
  }, [mode, keys, keyBusy])

  // 方式・鍵・シークレットに応じて「発行 → 改ざん → 検証」を再計算する。
  useEffect(() => {
    let alive = true
    ;(async () => {
      const admin = { ...BASE_PAYLOAD, role: "admin" }
      if (mode === "none") {
        const header = { alg: "none", typ: "JWT" }
        const next: DemoState = {
          issued: buildUnsignedToken(header, BASE_PAYLOAD),
          forged: buildUnsignedToken(header, admin),
          legitOk: true, // 署名を見ないので正規トークンは受理される
          tamperedDetected: false, // 改ざんも受理されてしまう
        }
        if (alive) setState(next)
        return
      }
      if (mode === "HS256") {
        const issued = await signHS256(BASE_PAYLOAD, secret)
        const forged = tamperClaims(issued, { role: "admin" })
        const [legit, tampered] = await Promise.all([
          verifyHS256(issued, secret),
          verifyHS256(forged, secret),
        ])
        if (alive) {
          setState({ issued, forged, legitOk: legit.valid, tamperedDetected: !tampered.valid })
        }
        return
      }
      // RS256
      if (!keys) {
        if (alive) setState(null)
        return
      }
      const issued = await signRS256(BASE_PAYLOAD, keys.privateKey)
      const forged = tamperClaims(issued, { role: "admin" })
      const [legit, tampered] = await Promise.all([
        verifyRS256(issued, keys.publicKey),
        verifyRS256(forged, keys.publicKey),
      ])
      if (alive) {
        setState({ issued, forged, legitOk: legit.valid, tamperedDetected: !tampered.valid })
      }
    })()
    return () => {
      alive = false
    }
  }, [mode, secret, keys])

  return (
    <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-slate-700/60 backdrop-blur">
      {/* 保護方式セレクタ */}
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          サーバーの署名方式
        </div>
        <div className="inline-flex rounded-lg bg-slate-950/70 p-1 ring-1 ring-slate-700">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                mode === m.key
                  ? "bg-indigo-500/70 text-indigo-50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 方式ごとの設定 */}
      {mode === "HS256" && (
        <label className="mb-5 block">
          <span className="text-xs text-slate-400">署名 &amp; 検証に使う共有シークレット</span>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg bg-slate-950/70 p-2.5 font-mono text-sm text-emerald-200 ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      )}
      {mode === "RS256" && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setKeys(null)
              }}
              tone="default"
              disabled={keyBusy}
            >
              {keyBusy ? "生成中…" : "鍵ペアを再生成"}
            </Button>
            <span className="text-xs text-slate-400">秘密鍵で署名・公開鍵で検証する</span>
          </div>
          {keys && (
            <div className="grid gap-3 lg:grid-cols-2">
              <CodePanel label="公開鍵 (SPKI PEM)" value={keys.publicPem.trim()} />
              <CodePanel label="秘密鍵 (PKCS#8 PEM)" value={keys.privatePem.trim()} />
            </div>
          )}
        </div>
      )}

      {/* ① 発行 */}
      <section className="space-y-2">
        <StepLabel n="①">
          サーバーが発行した正規トークン（role=user
          {mode === "none" ? "・署名なし" : "・署名あり"}）
        </StepLabel>
        {state ? <JwtWire token={state.issued} /> : <p className="text-sm text-slate-500">—</p>}
      </section>

      {/* ② 改ざん */}
      <section className="mt-6 space-y-2">
        <StepLabel n="②">
          攻撃者が payload を改ざん（<span className="text-rose-300">role: user → admin</span>）
        </StepLabel>
        {state ? <JwtWire token={state.forged} /> : <p className="text-sm text-slate-500">—</p>}
        {mode !== "none" && (
          <p className="text-xs text-slate-500">
            攻撃者は鍵を持たないため署名を作り直せず、元の署名を流用するしかない。
          </p>
        )}
      </section>

      {/* ③ 検証 */}
      <section className="mt-6 space-y-3 border-t border-slate-700/60 pt-4">
        <StepLabel n="③">この方式で検証した結果（改ざんを検出できたか）</StepLabel>
        <div className="divide-y divide-slate-800 rounded-lg bg-slate-950/40 ring-1 ring-slate-800">
          <VerdictRow label="正規トークン" ok={state?.legitOk ?? false}>
            {state ? (state.legitOk ? "検証OK → 受理" : "想定外の検証失敗") : "—"}
          </VerdictRow>
          <VerdictRow label="改ざんトークン" ok={state?.tamperedDetected ?? false}>
            {state
              ? state.tamperedDetected
                ? "改ざんを検出 → 拒否"
                : "検出できず → role=admin を受理（権限昇格）"
              : "—"}
          </VerdictRow>
        </div>
        <CodePanel label="ポイント" value={NOTES[mode]} />
      </section>
    </section>
  )
}
