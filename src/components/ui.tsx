/** デモ全体で使う小さな表示部品。 */
import type { ReactNode } from "react"

/** 検証結果などの状態バッジ。 */
export function StatusBadge({ ok, children }: { ok: boolean; children: ReactNode }) {
  const cls = ok
    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/40"
    : "bg-rose-500/15 text-rose-300 ring-rose-500/40"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ${cls}`}
    >
      <span aria-hidden>{ok ? "✅" : "❌"}</span>
      {children}
    </span>
  )
}

/** JWT を色分け表示するモノスペースブロック(header.payload.signature)。 */
export function JwtWire({ token }: { token: string }) {
  const [h, p, s] = token.split(".")
  return (
    <code className="block break-all rounded-lg bg-slate-950/70 p-3 font-mono text-[13px] leading-relaxed ring-1 ring-slate-700">
      <span className="text-rose-400">{h}</span>
      <span className="text-slate-500">.</span>
      <span className="text-sky-400">{p}</span>
      <span className="text-slate-500">.</span>
      <span className="text-emerald-400">{s || ""}</span>
    </code>
  )
}

/** ラベル付きの JSON/テキスト表示パネル。 */
export function CodePanel({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950/70 p-3 font-mono text-[12px] leading-relaxed text-slate-200 ring-1 ring-slate-700">
        {value}
      </pre>
    </div>
  )
}

/** デモ1枚分のカード枠。 */
export function DemoCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: string
  title: string
  subtitle: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-slate-700/60 backdrop-blur">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300 ring-1 ring-indigo-500/40">
          {step}
        </span>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-slate-400">{subtitle}</p>
      {children}
    </section>
  )
}

/** ボタン。 */
export function Button({
  onClick,
  children,
  tone = "default",
  disabled,
}: {
  onClick: () => void
  children: ReactNode
  tone?: "default" | "danger" | "primary"
  disabled?: boolean
}) {
  const tones = {
    default: "bg-slate-700/70 hover:bg-slate-600/80 text-slate-100",
    danger: "bg-rose-500/75 hover:bg-rose-500/90 text-rose-50",
    primary: "bg-indigo-500/75 hover:bg-indigo-500/90 text-indigo-50",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}
