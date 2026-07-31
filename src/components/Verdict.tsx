/**
 * 検証の結果。
 *
 * 盤面が追うのは改ざんされた券 1 枚だけなので、正しい券がどう扱われるかはここで並べる。
 * 「弾いているのは改ざんだけで、正規のものは通っている」ことが分かるように 2 行にしてある。
 */

import type { FlowState } from "./Stage.js"
import { IconCheck, IconCross } from "./icons.js"
import { Panel } from "./ui.js"

export function Verdict({ state }: { state: FlowState | null }) {
  return (
    <Panel title="検証の結果" hint="この方式で 2 枚を照合すると">
      <div className="divide-y divide-line-soft overflow-hidden rounded-xl border-[1.5px] border-line-soft">
        <Row
          label="正規の券"
          detail="role: user"
          ok={state?.legitOk ?? false}
          text={state === null ? "—" : state.legitOk ? "受理" : "想定外の検証失敗"}
        />
        <Row
          label="書き換えた券"
          detail="role: admin"
          ok={state?.tamperedDetected ?? false}
          text={
            state === null
              ? "—"
              : state.tamperedDetected
                ? "改ざんを検出 → 拒否"
                : "検出できず → 受理"
          }
        />
      </div>
    </Panel>
  )
}

/** 「対象 … 判定」を 1 行で。 */
function Row({
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
