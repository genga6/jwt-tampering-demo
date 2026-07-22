/**
 * デモ1: 署名なし JWT は誰でも改ざんできる。
 * payload(JSON)を編集すると、鍵なしでそのまま別トークンに再エンコードされる。
 */
import { useMemo, useState } from "react"
import { base64urlEncodeJson } from "../lib/base64url.js"
import { type JwtClaims, buildUnsignedToken, decodeWithoutVerification } from "../lib/jwt.js"
import { Button, CodePanel, DemoCard, JwtWire, StatusBadge } from "./ui.js"

const INITIAL: JwtClaims = { sub: "1234567890", name: "Alice", role: "user", iat: 1_700_000_000 }

export function TamperDemo() {
  const [payloadText, setPayloadText] = useState(JSON.stringify(INITIAL, null, 2))

  // payload を編集するたびに、鍵なしでトークンを再構築する。
  const { token, decodedRole, parseError } = useMemo(() => {
    try {
      const payload = JSON.parse(payloadText) as JwtClaims
      const tok = buildUnsignedToken({ alg: "none", typ: "JWT" }, payload)
      const decoded = decodeWithoutVerification(tok)
      return { token: tok, decodedRole: decoded.payload.role, parseError: null }
    } catch (e) {
      return {
        token: "",
        decodedRole: undefined,
        parseError: e instanceof Error ? e.message : String(e),
      }
    }
  }, [payloadText])

  function escalate() {
    try {
      const payload = JSON.parse(payloadText) as JwtClaims
      setPayloadText(JSON.stringify({ ...payload, role: "admin" }, null, 2))
    } catch {
      /* JSON が壊れている間は無視 */
    }
  }

  return (
    <DemoCard
      step="デモ 1"
      title="署名なし JWT は改ざん自由 (alg: none)"
      subtitle={
        <>
          Base64url は暗号化ではなく単なるエンコード。payload を書き換えて再エンコードするだけで、
          <strong className="text-slate-200"> 鍵を一切知らなくても </strong>
          別のトークンが作れてしまう。下の JSON を直接編集してみてください。
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              payload (自由に編集可能)
            </span>
            <Button onClick={escalate} tone="danger">
              role を admin に昇格
            </Button>
          </div>
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            spellCheck={false}
            rows={9}
            className="w-full rounded-lg bg-slate-950/70 p-3 font-mono text-[13px] text-sky-200 ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {parseError && <p className="text-sm text-rose-400">JSON エラー: {parseError}</p>}
        </div>

        <div className="space-y-3">
          <CodePanel
            label="header (base64url)"
            value={base64urlEncodeJson({ alg: "none", typ: "JWT" })}
          />
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              生成された署名なしトークン
            </div>
            {token ? <JwtWire token={token} /> : <p className="text-sm text-slate-500">—</p>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-700/60 pt-4">
        {decodedRole === "admin" ? (
          <StatusBadge ok={false}>検証なしサーバは role=admin を受理 → 権限昇格が成立</StatusBadge>
        ) : (
          <StatusBadge ok>
            現在 role={String(decodedRole)} — 「admin に昇格」を押してみて
          </StatusBadge>
        )}
        <span className="text-sm text-slate-400">
          教訓: 署名を検証せず payload を信用してはいけない。
        </span>
      </div>
    </DemoCard>
  )
}
