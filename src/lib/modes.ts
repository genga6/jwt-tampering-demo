/**
 * サーバーの署名方式と、それぞれに添える言葉。
 *
 * 画面の文章をここに集めてある。コンポーネント側には「どう並べるか」だけを残し、
 * 「何を言うか」は 1 か所で読めるようにしておく。
 */

export type Mode = "none" | "HS256" | "RS256"

export const MODE_KEYS: Mode[] = ["none", "HS256", "RS256"]

export interface ModeCopy {
  /** セレクタに出す短い名前。 */
  short: string
  /** header の alg に載る値。 */
  alg: string
  /** 鍵の持ち方を 1 行で。 */
  keying: string
  /** 発行のときサーバーが何をするか。 */
  issuing: string
  /** 改ざんされたトークンが検証でどうなるか。 */
  verdict: string
  /** この方式の要点。判定の下に置く。 */
  point: string
  /** 気をつける点（弱点・運用上の条件）。 */
  caveat: string
}

export const MODE_COPY: Record<Mode, ModeCopy> = {
  none: {
    short: "なし",
    alg: "alg: none",
    keying: "鍵を使わない",
    issuing: "header と payload を Base64url で並べるだけ。署名の欄は空のまま。",
    verdict: "署名を見ないので、書き換えられた payload がそのまま通る。",
    point:
      "alg:none を許容する（または署名を検証しない）サーバーは、改ざんを検出できない。" +
      "攻撃者は署名付きトークンを alg:none に格下げしてこの状態を作り出す。",
    caveat:
      "対策は、受け付ける alg を allowlist で固定して none を禁止し、必ず署名を検証すること。",
  },
  HS256: {
    short: "HS256",
    alg: "alg: HS256",
    keying: "1 本のシークレットを署名側と検証側で共有する",
    issuing: "header と payload を共有シークレットの HMAC にかけ、その値を署名の欄に入れる。",
    verdict: "payload を 1 文字変えると HMAC が合わなくなり、検証が落ちる。",
    point: "共有シークレットの HMAC で署名する。payload を書き換えると HMAC が一致せず検出できる。",
    caveat:
      "検証する側とシークレットを共有する必要があり、それが漏れると攻撃者も正しい署名を作れてしまう。",
  },
  RS256: {
    short: "RS256",
    alg: "alg: RS256",
    keying: "秘密鍵で署名し、公開鍵で検証する",
    issuing: "header と payload に秘密鍵で署名する。検証する側は公開鍵だけを持っていればよい。",
    verdict: "payload を書き換えても、秘密鍵がなければ署名を作り直せないので検証が落ちる。",
    point: "秘密鍵で署名し、公開鍵で検証する。公開鍵を配っても、秘密鍵なしには偽造できない。",
    caveat: "第三者や別サービスへ JWT を配る用途に向く。守るべき鍵は秘密鍵 1 本だけになる。",
  },
}
