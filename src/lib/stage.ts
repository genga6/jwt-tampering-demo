/**
 * 盤面で再生する手順。
 *
 * 「発行サーバー → 経路（攻撃者） → 入口（検証）」を券が 1 枚渡っていく 7 手。
 * どの手も、券がどこにいて・券がどう見えて・入口がどうなっているかだけを持つ。
 * 文章もここに置いてあるので、盤面のコンポーネントは並べ方だけを気にすればよい。
 */

import { MODE_COPY, type Mode } from "./modes.js"

/** 券がいる場所。 */
export type Lane = "issuer" | "wire" | "verifier"

/** 入口の様子。open は「通ってしまった」なので、良い状態ではない。 */
export type Gate = "idle" | "checking" | "open" | "closed"

export type ActId = "issue" | "handover" | "read" | "tamper" | "send" | "verify" | "gate"

export interface Act {
  id: ActId
  lane: Lane
  /** 誰の手番か。盤面のアクターを光らせるのに使う。 */
  actor: "issuer" | "attacker" | "verifier"
  title: string
  body: string
  tone: "neutral" | "danger" | "safe"
  /** 券が書き換えられた状態で描かれるか。 */
  tampered: boolean
  /** 券が読まれている手（虫眼鏡が出る）。 */
  reading?: boolean
  gate: Gate
  /** 攻撃者の窓に出す一言。 */
  wiretap: string
}

/**
 * いまの方式と検証結果から 7 手を組む。
 *
 * 変わるのは 1 手目（署名を付けるか）・4 手目（署名を作り直せるか）・
 * 6〜7 手目（照合して弾けるか）だけ。他は方式によらず同じ。
 */
export function buildActs(mode: Mode, detected: boolean): Act[] {
  const copy = MODE_COPY[mode]
  const signed = mode !== "none"

  return [
    {
      id: "issue",
      lane: "issuer",
      actor: "issuer",
      title: "サーバーが券を発行する",
      body: copy.issuing,
      tone: "neutral",
      tampered: false,
      gate: "idle",
      wiretap: "まだ経路に出ていない。",
    },
    {
      id: "handover",
      lane: "wire",
      actor: "attacker",
      title: "券が経路に出る",
      body: "利用者はこの券を持って API を呼ぶ。その経路の途中に攻撃者がいる。",
      tone: "neutral",
      tampered: false,
      gate: "idle",
      wiretap: "券が手に入った。",
    },
    {
      id: "read",
      lane: "wire",
      actor: "attacker",
      title: "攻撃者が中身を読む",
      body: "payload は Base64url で並べてあるだけ。鍵は要らないので、そのまま読める。",
      tone: "neutral",
      tampered: false,
      reading: true,
      gate: "idle",
      wiretap: "誰の券で、どの権限かが読めている。",
    },
    {
      id: "tamper",
      lane: "wire",
      actor: "attacker",
      title: "role を admin に書き換える",
      body: signed
        ? "payload は書き換えられる。ただし鍵がないので署名は作り直せず、発行時のものが残る。"
        : "署名の欄は初めから空なので、書き換えても矛盾する場所がない。",
      tone: "danger",
      tampered: true,
      gate: "idle",
      wiretap: signed
        ? "payload は変えられた。署名だけが前のまま。"
        : "封がないので、好きな中身の券を作れる。",
    },
    {
      id: "send",
      lane: "verifier",
      actor: "attacker",
      title: "書き換えた券を出す",
      body: "攻撃者はこの券を持って、サーバーの入口に立つ。",
      tone: "danger",
      tampered: true,
      gate: "idle",
      wiretap: "あとは入口が受け取るかどうか。",
    },
    {
      id: "verify",
      lane: "verifier",
      actor: "verifier",
      title: signed ? "入口が署名を照合する" : "入口は署名を見ない",
      body: copy.verdict,
      tone: "neutral",
      tampered: true,
      gate: "checking",
      wiretap: signed ? "照合されている。" : "照合そのものが起きない。",
    },
    {
      id: "gate",
      lane: "verifier",
      actor: "verifier",
      title: detected ? "弾かれた" : "通ってしまった",
      body: detected
        ? "改ざんされた券は入口で止まり、role=admin は届かない。"
        : "サーバーは role=admin のユーザーとして扱う。管理者しか触れないはずの操作が通る。",
      tone: detected ? "safe" : "danger",
      tampered: true,
      gate: detected ? "closed" : "open",
      wiretap: detected ? "権限昇格は成立しない。" : "権限昇格が成立した。",
    },
  ]
}
