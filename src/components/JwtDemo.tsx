/**
 * JWT 改ざんデモ（保護方式セレクタ統合版）。
 *
 * 「同じ改ざん（role: user → admin）」を、サーバーの署名方式ごとに検証する:
 *   - なし (alg:none): 署名を検証しない/none を許容 → 改ざんを検出できない (×)
 *   - HS256 (対称鍵): 共有シークレットの HMAC → 検出できる (〇)
 *   - RS256 (非対称鍵): 秘密鍵で署名・公開鍵で検証 → 検出できる (〇)
 *
 * 署名/検証/鍵生成はすべてブラウザの Web Crypto 上(jose)で実行する。
 *
 * 画面は 3 段:
 *   ステータスバー … いまの結末だけを 1 行で
 *   盤面 ＋ 設定    … 見る場所と、いじる場所を隣に置く
 *   要点            … いま選んでいる方式について言えること
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
import { MODE_COPY, type Mode } from "../lib/modes.js"
import { ModeRack } from "./ModeRack.js"
import { type FlowState, TokenFlow } from "./TokenFlow.js"
import { IconSeal, IconSealBroken } from "./icons.js"
import { Panel, Pill } from "./ui.js"

const BASE_PAYLOAD = { sub: "1234567890", name: "Alice", role: "user" }

export function JwtDemo() {
  const [mode, setMode] = useState<Mode>("none")
  const [secret, setSecret] = useState("super-secret-shared-key")
  const [keys, setKeys] = useState<RsaKeyPair | null>(null)
  const [keyBusy, setKeyBusy] = useState(false)
  const [state, setState] = useState<FlowState | null>(null)

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
        const next: FlowState = {
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
    <div className="space-y-3">
      <StatusBar mode={mode} state={state} />

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <TokenFlow mode={mode} state={state} />
        <ModeRack
          mode={mode}
          onModeChange={setMode}
          secret={secret}
          onSecretChange={setSecret}
          keys={keys}
          keyBusy={keyBusy}
          onRegenerateKeys={() => setKeys(null)}
        />
      </div>

      <Panel title="この方式の要点">
        <p className="text-xs leading-relaxed text-ink-soft">{MODE_COPY[mode].point}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">{MODE_COPY[mode].caveat}</p>
      </Panel>
    </div>
  )
}

/**
 * いまの結末を 1 段で。
 *
 * 「封がされているか」「改ざんを検出できたか」「権限が昇格したか」の 3 つだけ。
 * 方式を切り替えたときにここだけ見ていれば、結論の入れ替わりが分かる。
 */
function StatusBar({ mode, state }: { mode: Mode; state: FlowState | null }) {
  const sealed = mode !== "none"
  const detected = state?.tamperedDetected ?? false

  return (
    <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-2.5">
      <span className="flex items-center gap-1.5">
        <span className={sealed ? "text-safe" : "text-alarm"}>
          {sealed ? <IconSeal size={18} /> : <IconSealBroken size={18} />}
        </span>
        <span className="text-xs font-bold">{sealed ? "署名あり" : "署名なし"}</span>
        <span className="font-mono text-[11px] text-ink-faint">{MODE_COPY[mode].alg}</span>
      </span>

      <span className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
          改ざん
        </span>
        {state === null ? (
          <Pill tone="muted">計算中…</Pill>
        ) : detected ? (
          <Pill tone="safe">検出できた</Pill>
        ) : (
          <Pill tone="alarm">素通りした</Pill>
        )}
      </span>

      <span className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
          権限昇格
        </span>
        {state === null ? (
          <Pill tone="muted">—</Pill>
        ) : detected ? (
          <Pill tone="safe">成立しない</Pill>
        ) : (
          <Pill tone="alarm">成立した</Pill>
        )}
      </span>

      <span className="ml-auto font-mono text-[11px] text-ink-faint">role: user → admin</span>
    </div>
  )
}
