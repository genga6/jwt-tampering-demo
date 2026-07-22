/**
 * デモ3: RS256(非対称鍵)。秘密鍵で署名し、公開鍵で検証する。
 * 検証側は公開鍵しか持たないため、偽造できず改ざんも検出できる。
 */
import { useState } from "react"
import {
  type RsaKeyPair,
  type VerifyResult,
  generateRs256KeyPair,
  signRS256,
  verifyRS256,
} from "../lib/jose-crypto.js"
import { type JwtClaims, tamperClaims } from "../lib/jwt.js"
import { Button, CodePanel, DemoCard, JwtWire, StatusBadge } from "./ui.js"

const BASE_PAYLOAD: JwtClaims = { sub: "1234567890", name: "Alice", role: "user" }

export function Rs256Demo() {
  const [keys, setKeys] = useState<RsaKeyPair | null>(null)
  const [signed, setSigned] = useState("")
  const [tampered, setTampered] = useState("")
  const [signedResult, setSignedResult] = useState<VerifyResult | null>(null)
  const [tamperedResult, setTamperedResult] = useState<VerifyResult | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate() {
    setBusy(true)
    try {
      setKeys(await generateRs256KeyPair())
      setSigned("")
      setTampered("")
      setSignedResult(null)
      setTamperedResult(null)
    } finally {
      setBusy(false)
    }
  }

  async function sign() {
    if (!keys) return
    const token = await signRS256({ ...BASE_PAYLOAD }, keys.privateKey)
    setSigned(token)
    setTampered(tamperClaims(token, { role: "admin" }))
    setSignedResult(null)
    setTamperedResult(null)
  }

  async function verifyAll() {
    if (!keys) return
    setSignedResult(await verifyRS256(signed, keys.publicKey))
    setTamperedResult(await verifyRS256(tampered, keys.publicKey))
  }

  return (
    <DemoCard
      step="デモ 3"
      title="RS256 — 非対称鍵(秘密鍵で署名・公開鍵で検証)"
      subtitle={
        <>
          発行者だけが秘密鍵を持ち、検証側は公開鍵だけを持つ。公開鍵が漏れても
          <strong className="text-slate-200"> 偽造はできず</strong>
          、payload を書き換えたトークンは署名検証で必ず弾かれる。
        </>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Button onClick={generate} tone="default" disabled={busy}>
          1. 鍵ペアを生成
        </Button>
        <Button onClick={sign} tone="primary" disabled={!keys}>
          2. 秘密鍵で署名 (role=user)
        </Button>
        <Button onClick={verifyAll} tone="default" disabled={!signed}>
          3. 公開鍵で検証
        </Button>
      </div>

      {keys && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <CodePanel label="公開鍵 (SPKI PEM) — 検証側が持つ" value={keys.publicPem.trim()} />
          <CodePanel
            label="秘密鍵 (PKCS#8 PEM) — 発行者だけが持つ"
            value={keys.privatePem.trim()}
          />
        </div>
      )}

      {signed && (
        <div className="mt-5 space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              正規トークン (秘密鍵で署名)
            </div>
            <JwtWire token={signed} />
            {signedResult && (
              <StatusBadge ok={signedResult.valid}>
                {signedResult.valid
                  ? `公開鍵で検証OK — role=${String(signedResult.payload?.role)}`
                  : `検証NG: ${signedResult.error}`}
              </StatusBadge>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              改ざんトークン (role=admin に書き換え・署名は流用)
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

          <CodePanel
            label="ポイント"
            value={
              "RS256 は署名鍵(秘密)と検証鍵(公開)が分離している。\n" +
              "検証側に公開鍵を配っても、秘密鍵がなければ有効な署名は作れない。\n" +
              "→ マイクロサービス間や外部への JWT 配布に向く。"
            }
          />
        </div>
      )}
    </DemoCard>
  )
}
