/**
 * 盤面。①発行 → ②改ざん → ③検証 を上から 1 本の流れで並べる。
 *
 * 3 手しかないので送りボタンは付けない。3 手ぶんを同時に置いて、**同じ改ざんが方式によって
 * 通るか弾かれるか**が、右の設定を触った瞬間に同じ場所で入れ替わるようにしてある。
 *
 * ここに出ている値は表示用に用意したものではなく、その場で Web Crypto を回した結果。
 */

import { decodeWithoutVerification } from "../lib/jwt.js"
import { MODE_COPY, type Mode } from "../lib/modes.js"
import { ClaimsView, TokenTicket } from "./Token.js"
import { IconCheck, IconCross, IconGear, IconMask, IconPen, IconServer } from "./icons.js"
import { Panel, Pill } from "./ui.js"

export interface FlowState {
  /** サーバーが発行した正規トークン。 */
  issued: string
  /** 攻撃者が payload を書き換えたトークン。 */
  forged: string
  /** 正規トークンが検証を通ったか。 */
  legitOk: boolean
  /** 改ざんを検出できたか。 */
  tamperedDetected: boolean
}

export function TokenFlow({ mode, state }: { mode: Mode; state: FlowState | null }) {
  const copy = MODE_COPY[mode]

  if (!state) {
    return (
      <Panel title="トークンの流れ" hint="発行 → 改ざん → 検証">
        <p className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-ink-soft">
          <span className="cranking flex text-accent">
            <IconGear size={20} />
          </span>
          鍵ペアを生成中…
        </p>
      </Panel>
    )
  }

  const issuedClaims = decodeWithoutVerification(state.issued).payload
  const forgedClaims = decodeWithoutVerification(state.forged).payload
  const passed = !state.tamperedDetected

  return (
    <Panel
      title="トークンの流れ"
      hint="発行 → 改ざん → 検証"
      actions={<Pill tone="accent">{copy.alg}</Pill>}
    >
      <ol className="flex flex-col">
        <Step
          index="①"
          title="サーバーがトークンを発行する"
          actor="サーバー"
          actorIcon={<IconServer size={14} />}
        >
          <p className="text-xs leading-relaxed text-ink-soft">{copy.issuing}</p>
          <div className="mt-2">
            <TokenTicket token={state.issued} alg={copy.alg} />
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
              payload を Base64url から戻したもの
            </p>
            <div className="mt-1">
              <ClaimsView claims={issuedClaims} />
            </div>
          </div>
        </Step>

        <Step
          index="②"
          title="攻撃者が payload を書き換える"
          actor="攻撃者"
          actorIcon={<IconMask size={14} />}
          tone="alarm"
        >
          <p className="flex flex-wrap items-center gap-1.5 text-xs leading-relaxed text-ink-soft">
            <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-alarm">
              <IconPen size={13} />
              role: user → admin
            </span>
            <span>鍵は要らない。Base64url を戻して書き換え、また並べ直すだけ。</span>
          </p>
          <div className="mt-2">
            <ClaimsView claims={forgedClaims} base={issuedClaims} />
          </div>
          <div className="mt-2">
            <TokenTicket token={state.forged} alg={copy.alg} tampered />
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
            {mode === "none"
              ? "署名の欄は初めから空なので、書き換えても矛盾する場所がない。"
              : "攻撃者は鍵を持たないので署名は作り直せず、発行時のものを流用するしかない。"}
          </p>
        </Step>

        <Step
          index="③"
          title="サーバーが検証する"
          actor="サーバー"
          actorIcon={<IconServer size={14} />}
          tone={passed ? "alarm" : "safe"}
          last
        >
          <p className="text-xs leading-relaxed text-ink-soft">{copy.verdict}</p>

          <div className="mt-2 divide-y divide-line-soft overflow-hidden rounded-xl border-[1.5px] border-line-soft">
            <VerdictRow
              label="正規トークン"
              detail="role: user"
              ok={state.legitOk}
              text={state.legitOk ? "受理" : "想定外の検証失敗"}
            />
            <VerdictRow
              label="改ざんトークン"
              detail="role: admin"
              ok={state.tamperedDetected}
              text={state.tamperedDetected ? "改ざんを検出 → 拒否" : "検出できず → 受理"}
            />
          </div>

          <p
            className={`mt-2 rounded-xl border-[1.5px] px-3 py-2 text-xs leading-relaxed ${
              passed
                ? "alarm-flash border-alarm/50 bg-alarm-soft font-semibold text-alarm"
                : "border-safe/40 bg-safe-soft text-safe"
            }`}
          >
            {passed ? (
              <>
                <strong className="font-bold">権限昇格が成立。</strong>
                サーバーは role=admin のユーザーとして扱う。管理者しか触れないはずの操作が通る。
              </>
            ) : (
              <>
                <strong className="font-bold">権限昇格は成立しない。</strong>
                改ざんされたトークンは検証で弾かれ、role=admin は届かない。
              </>
            )}
          </p>
        </Step>
      </ol>
    </Panel>
  )
}

/**
 * 流れの 1 手。
 *
 * 番号を振ってあるのは、この 3 つが本当に順番に起きることだから（並べ替えても読めるなら
 * 番号は付けない）。左の縦線は次の手へ続いていることを示すだけの線。
 */
function Step({
  index,
  title,
  actor,
  actorIcon,
  tone = "accent",
  last = false,
  children,
}: {
  index: string
  title: string
  actor: string
  actorIcon: React.ReactElement
  tone?: "accent" | "alarm" | "safe"
  last?: boolean
  children: React.ReactNode
}) {
  const badge = {
    accent: "border-accent-deep bg-accent text-white",
    alarm: "border-alarm bg-alarm-soft text-alarm",
    safe: "border-safe bg-safe-soft text-safe",
  }[tone]

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 sm:gap-x-3">
      <div className="flex flex-col items-center">
        <span
          className={`flex size-7 items-center justify-center rounded-lg border-[1.5px] text-sm font-bold ${badge}`}
        >
          {index}
        </span>
        {!last && <span className="mt-1 w-0 flex-1 border-l-[1.5px] border-dashed border-line" />}
      </div>

      <div className={last ? "min-w-0" : "min-w-0 pb-4"}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-sm font-bold">{title}</h3>
          <span className="flex items-center gap-1 text-[11px] font-bold text-ink-faint">
            {actorIcon}
            {actor}
          </span>
        </div>
        <div className="mt-1.5">{children}</div>
      </div>
    </li>
  )
}

/** 「対象 … 判定」を 1 行で。 */
function VerdictRow({
  label,
  detail,
  ok,
  text,
}: {
  label: string
  detail: string
  ok: boolean
  text: string
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 ${
        ok ? "bg-card" : "bg-alarm-soft/50"
      }`}
    >
      <span className="flex items-baseline gap-2">
        <span className="text-xs font-bold">{label}</span>
        <span className="font-mono text-[11px] text-ink-faint">{detail}</span>
      </span>
      <span
        className={`flex items-center gap-1.5 text-xs font-bold ${ok ? "text-safe" : "text-alarm"}`}
      >
        {ok ? <IconCheck size={16} /> : <IconCross size={16} />}
        {text}
      </span>
    </div>
  )
}
