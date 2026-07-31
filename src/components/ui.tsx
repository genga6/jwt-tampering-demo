/** 盤面で使い回す小さな部品。見た目の定義は index.css の .panel / .btn / .pill / .stub に置いてある。 */

import type { ReactNode } from "react"

type Tone = "safe" | "open" | "alarm" | "muted" | "accent"

const PILL_TONES: Record<Tone, string> = {
  safe: "bg-safe-soft text-safe border-safe/40",
  open: "bg-open-soft text-open border-open/40",
  alarm: "bg-alarm-soft text-alarm border-alarm/40",
  muted: "bg-paper text-ink-soft border-line",
  accent: "bg-accent-soft text-accent-deep border-accent/40",
}

/** 状態を一目で出す札。 */
export function Pill({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`pill ${PILL_TONES[tone]}`}>{children}</span>
}

/** 盤面に置く板。 */
export function Panel({
  title,
  hint,
  actions,
  children,
  className = "",
}: {
  title?: string
  hint?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  // min-w-0 が要る。中に折り返せない等幅の 1 行があるため、これがないと
  // グリッドの列が中身の幅まで広がり、画面ごと横スクロールしてしまう。
  return (
    <section className={`panel flex min-w-0 flex-col ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-3.5 py-2.5">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="text-sm font-bold tracking-wide">{title}</h2>
            {hint && <p className="text-xs text-ink-faint">{hint}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="flex flex-1 flex-col p-3.5">{children}</div>
    </section>
  )
}

/** 押せるもの。 */
export function Button({
  onClick,
  tone = "neutral",
  disabled,
  label,
  title,
  children,
}: {
  onClick: () => void
  tone?: "neutral" | "accent"
  disabled?: boolean
  /** アイコンだけのボタンに付ける読み上げ用の名前。 */
  label?: string
  title?: string
  children: ReactNode
}) {
  const toneClass = { neutral: "", accent: "btn-accent" }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title ?? label}
      className={`btn ${toneClass}`}
    >
      {children}
    </button>
  )
}

/**
 * いくつかから 1 つ選ぶ切り替え。
 *
 * radio のまま見た目だけ差し替えている（矢印キーでの移動と読み上げをそのまま活かすため）。
 */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  /** 同じグループだと分かるための名前。画面には出さない。 */
  name: string
  value: T
  options: { key: T; label: string; hint?: string }[]
  onChange: (next: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl border-[1.5px] border-line-soft bg-paper p-1">
      {options.map((option) => {
        const selected = option.key === value
        return (
          <label
            key={option.key}
            title={option.hint}
            className={`relative min-w-0 flex-1 cursor-pointer rounded-lg border-[1.5px] px-2 py-1.5 text-center transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              selected
                ? "border-accent-deep bg-accent text-white"
                : "border-transparent text-ink-soft hover:border-line hover:bg-card"
            }`}
          >
            {/* 見た目だけ差し替えた radio。矢印キーでの移動と読み上げはそのまま。 */}
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(option.key)}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
            />
            <span className="block truncate text-xs font-bold">{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

/** 等幅のかたまり。平文の JSON や PEM をそのまま見せる。 */
export function Wire({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "open" | "alarm" | "safe"
  children: ReactNode
}) {
  const tones = {
    muted: "border-line-soft bg-paper text-ink-soft",
    open: "border-open/30 bg-open-soft text-open",
    alarm: "border-alarm/30 bg-alarm-soft text-alarm",
    safe: "border-safe/30 bg-safe-soft text-safe",
  }
  return (
    <pre
      className={`overflow-x-auto rounded-lg border px-2.5 py-1.5 font-mono text-[11px] leading-relaxed whitespace-pre ${tones[tone]}`}
    >
      {children}
    </pre>
  )
}

/** ラベルを付けた等幅のかたまり。鍵の PEM など、畳んでおきたい長いもの用。 */
export function LabeledWire({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">{label}</p>
      <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-line-soft bg-paper">
        {/* PEM は 1 行 64 字なので、細い列では横に切るより折り返したほうが読める。 */}
        <pre className="px-2.5 py-1.5 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap text-ink-soft">
          {value}
        </pre>
      </div>
    </div>
  )
}

/**
 * 開くと補足が出る小さな折りたたみ。閉じているときは 1 行しか占めない。
 *
 * 見た目を小さなボタンにしてあるのは、ただの文字だと押せることに気づかれないため。
 */
export function More({
  summary,
  children,
  popover = false,
}: {
  summary: string
  children: ReactNode
  /**
   * 開いた中身を浮かせる。
   *
   * 並びの中に置いた折りたたみは、開くと周りを押しのけてボタン自体が動いてしまう。
   * 位置を動かしたくない場所ではこちらを使う。
   */
  popover?: boolean
}) {
  return (
    <details className={`group ${popover ? "relative" : ""}`}>
      <summary className="inline-flex list-none items-center gap-1 rounded-lg border-[1.5px] border-line-soft bg-paper px-2 py-1 text-[11px] font-bold text-accent-deep transition-colors hover:border-accent/50 hover:text-accent [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 24 24"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform group-open:rotate-90"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
        {summary}
      </summary>
      <div
        className={
          popover ? "absolute right-0 z-20 mt-1.5 w-[min(26rem,calc(100vw-2rem))]" : "mt-1.5"
        }
      >
        {children}
      </div>
    </details>
  )
}
