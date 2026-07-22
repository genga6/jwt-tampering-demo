/**
 * デモ2: HS256(対称鍵)で署名すると改ざんを検出できる。
 * 共有シークレットで署名し、payload を書き換えたトークンは検証で弾かれる。
 */
import { useState } from "react"
import { type VerifyResult, signHS256, verifyHS256 } from "../lib/jose-crypto.js"
import { type JwtClaims, tamperClaims } from "../lib/jwt.js"
import { Button, CodePanel, DemoCard, JwtWire, StatusBadge } from "./ui.js"

const BASE_PAYLOAD: JwtClaims = { sub: "1234567890", name: "Alice", role: "user" }

export function Hs256Demo() {
  const [secret, setSecret] = useState("super-secret-shared-key")
  const [wrongSecret, setWrongSecret] = useState("attacker-guess")
  const [signed, setSigned] = useState("")
  const [tampered, setTampered] = useState("")
  const [signedResult, setSignedResult] = useState<VerifyResult | null>(null)
  const [tamperedResult, setTamperedResult] = useState<VerifyResult | null>(null)
  const [wrongKeyResult, setWrongKeyResult] = useState<VerifyResult | null>(null)

  async function sign() {
    const token = await signHS256({ ...BASE_PAYLOAD }, secret)
    setSigned(token)
    // 攻撃者が role=admin に書き換える(署名部はそのまま流用)。
    setTampered(tamperClaims(token, { role: "admin" }))
    setSignedResult(null)
    setTamperedResult(null)
    setWrongKeyResult(null)
  }

  async function verifyAll() {
    setSignedResult(await verifyHS256(signed, secret))
    setTamperedResult(await verifyHS256(tampered, secret))
    setWrongKeyResult(await verifyHS256(signed, wrongSecret))
  }

  return (
    <DemoCard
      step="デモ 2"
      title="HS256 — 対称鍵(共有シークレット)による署名"
      subtitle={
        <>
          同じシークレットで署名・検証する HMAC 方式。payload を書き換えると HMAC が合わなくなり、
          <strong className="text-slate-200"> jwtVerify が改ざんを検出</strong>
          する。さらに誤ったシークレットでは正しいトークンすら検証できないことも示す。
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            共有シークレット (署名 & 検証)
          </span>
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950/70 p-2.5 font-mono text-sm text-emerald-200 ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            攻撃者が推測した誤シークレット
          </span>
          <input
            value={wrongSecret}
            onChange={(e) => setWrongSecret(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-950/70 p-2.5 font-mono text-sm text-rose-200 ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={sign} tone="primary">
          1. role=user で署名
        </Button>
        <Button onClick={verifyAll} tone="default" disabled={!signed}>
          2. 3通りを検証
        </Button>
      </div>

      {signed && (
        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              正規トークン (署名あり)
            </div>
            <JwtWire token={signed} />
            {signedResult && (
              <StatusBadge ok={signedResult.valid}>
                {signedResult.valid
                  ? `正規シークレットで検証OK — role=${String(signedResult.payload?.role)}`
                  : `検証NG: ${signedResult.error}`}
              </StatusBadge>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              改ざんトークン (payload を role=admin に書き換え・署名は流用)
            </div>
            <JwtWire token={tampered} />
            {tamperedResult && (
              <StatusBadge ok={tamperedResult.valid}>
                {tamperedResult.valid
                  ? `検証OK (想定外!) role=${String(tamperedResult.payload?.role)}`
                  : `改ざんを検出 → 拒否: ${tamperedResult.error}`}
              </StatusBadge>
            )}
          </div>

          {wrongKeyResult && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                誤シークレットで正規トークンを検証
              </div>
              <StatusBadge ok={wrongKeyResult.valid}>
                {wrongKeyResult.valid
                  ? "検証OK (想定外!)"
                  : `鍵不一致で拒否: ${wrongKeyResult.error}`}
              </StatusBadge>
            </div>
          )}

          <CodePanel
            label="ポイント"
            value={
              "HS256 は署名鍵=検証鍵。改ざんすると HMAC が一致せず必ず失敗する。\n" +
              "ただし検証側とシークレットを共有する必要があり、鍵漏洩=偽造可能。\n" +
              "第三者に検証させたい場合は非対称鍵(デモ3のRS256)が適する。"
            }
          />
        </div>
      )}
    </DemoCard>
  )
}
