/**
 * トークンの見せ方。
 *
 * JWT は「`.` で 3 つに切られた 1 枚の券」なので、そう見えるように 3 段の半券で描く。
 * 上から順に読めばトークンの文字列そのものになる（2 段目・3 段目の頭の `.` も本物の一部）。
 *
 * 段ごとに色が違うのは飾りではない。header は「どの方式か」が書いてある場所、payload は
 * 「鍵なしで誰でも読める」場所、signature は「封」。この 3 つの性質の違いがこのデモの主題で、
 * 色はそれをそのまま指している。
 */

import type { JwtClaims } from "../lib/jwt.js"
import { IconEye, IconMagnifier, IconPen, IconSeal, IconSealBroken } from "./icons.js"

/**
 * 盤面を渡っていく券。
 *
 * 盤の上では base64 の文字列は読ませない（読ませても分からない）。券に書いてあることを
 * そのまま出す ── 誰の券で、どの権限で、封がされているか。文字列そのものは盤の下の
 * 「トークンの中身を全部見る」に置いてある。
 */
export function MiniTicket({
  claims,
  alg,
  sealed,
  tampered = false,
  reading = false,
}: {
  claims: JwtClaims
  alg: string
  /** 署名が付いているか。 */
  sealed: boolean
  /** payload が書き換えられた後の券。 */
  tampered?: boolean
  /** いま攻撃者に読まれている。 */
  reading?: boolean
}) {
  return (
    <div
      className={`relative w-[9.5rem] rounded-xl border-[1.5px] bg-card sm:w-[13rem] ${
        tampered
          ? "border-alarm shadow-[0_2px_0_var(--color-alarm)]"
          : "border-line shadow-[0_2px_0_var(--color-line)]"
      } ${reading ? "outline-2 outline-offset-2 outline-accent" : ""}`}
    >
      {reading && (
        <span className="absolute -top-3 -left-3 flex size-6 items-center justify-center rounded-full border-[1.5px] border-accent bg-card text-accent">
          <IconMagnifier size={14} />
        </span>
      )}
      {tampered && (
        <span className="absolute -top-3 -left-3 flex size-6 items-center justify-center rounded-full border-[1.5px] border-alarm bg-card text-alarm">
          <IconPen size={13} />
        </span>
      )}

      <div className="flex items-baseline justify-between gap-1 rounded-t-[10px] bg-accent-soft/60 px-2 py-1">
        <span className="text-[10px] font-bold tracking-wider text-accent-deep uppercase">jwt</span>
        <span className="truncate font-mono text-[10px] text-accent-deep">{alg}</span>
      </div>

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 px-2 py-1.5 text-[11px]">
        <dt className="text-ink-faint">name</dt>
        <dd className="truncate font-mono text-ink-soft">{String(claims.name ?? "—")}</dd>
        <dt className={tampered ? "font-bold text-alarm" : "text-ink-faint"}>role</dt>
        <dd
          className={`truncate rounded px-1 font-mono ${
            tampered ? "patched bg-alarm/12 font-bold text-alarm" : "text-ink-soft"
          }`}
        >
          {String(claims.role ?? "—")}
        </dd>
      </dl>

      <div
        className={`flex items-center gap-1.5 rounded-b-[10px] border-t-[1.5px] border-dashed px-2 py-1 text-[10px] font-bold ${
          sealed
            ? tampered
              ? "border-alarm/40 bg-alarm-soft/60 text-alarm"
              : "border-safe/40 bg-safe-soft/60 text-safe"
            : "border-line bg-paper text-ink-faint"
        }`}
      >
        {sealed && !tampered ? <IconSeal size={13} /> : <IconSealBroken size={13} />}
        {sealed ? (tampered ? "封は発行時のまま" : "封あり") : "封なし"}
      </div>
    </div>
  )
}

/** 半券 1 段。 */
function Stub({
  label,
  note,
  icon,
  dot,
  value,
  tone,
  seam,
  patched,
}: {
  label: string
  /** その段が何をしている場所なのか。ラベルの脇に小さく置く。 */
  note: string
  icon?: React.ReactElement
  /** 段の頭に付くトークンの区切り文字。1 段目には無い。 */
  dot: boolean
  value: React.ReactNode
  tone: "accent" | "open" | "safe" | "alarm" | "muted"
  seam: boolean
  /** 書き換えられた段。一度だけ色を差す。 */
  patched?: boolean
}) {
  const tones = {
    accent: "text-accent-deep",
    open: "text-open",
    safe: "text-safe",
    alarm: "text-alarm",
    muted: "text-ink-faint",
  }
  const grounds = {
    accent: "bg-accent-soft/50",
    open: "bg-open-soft/60",
    safe: "bg-safe-soft/60",
    alarm: "bg-alarm-soft/60",
    muted: "bg-paper",
  }

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-2.5 py-1.5 sm:flex-nowrap ${grounds[tone]} ${
        seam ? "border-t-[1.5px] border-dashed border-line" : ""
      } ${patched ? "patched" : ""}`}
    >
      <span className="flex w-full shrink-0 items-center gap-1 sm:w-[9.75rem]">
        {icon && <span className={tones[tone]}>{icon}</span>}
        <span className={`text-[10px] font-bold tracking-wider uppercase ${tones[tone]}`}>
          {label}
        </span>
        <span className="truncate text-[10px] text-ink-faint">{note}</span>
      </span>
      <span className="min-w-0 flex-1 font-mono text-[11px] leading-relaxed break-all">
        {dot && <span className="text-ink-faint">.</span>}
        {value}
      </span>
    </div>
  )
}

/** トークン 1 本を 3 段の半券で見せる。 */
export function TokenTicket({
  token,
  alg,
  tampered = false,
}: {
  token: string
  /** header の alg 値。1 段目のラベル脇に出す。 */
  alg: string
  /**
   * 改ざん後のトークン。
   *
   * payload の段に色が差し、署名の段には「発行時のまま」と出る。攻撃者は鍵を持たないので
   * 署名だけが前のトークンのものとして残る — 検証が落ちる理由がその 1 段に出ている。
   */
  tampered?: boolean
}) {
  const [header = "", payload = "", signature = ""] = token.split(".")
  const sealed = signature.length > 0
  const stale = tampered && sealed

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-line bg-card">
      <Stub
        label="header"
        note={alg}
        dot={false}
        tone="accent"
        seam={false}
        value={<span className="text-accent-deep">{header}</span>}
      />
      <Stub
        label="payload"
        note="誰でも読める"
        icon={<IconEye size={13} />}
        dot
        tone="open"
        seam
        patched={tampered}
        value={<span className="text-open">{payload}</span>}
      />
      <Stub
        label="signature"
        note={stale ? "発行時のまま" : sealed ? "封" : "封がない"}
        icon={sealed && !stale ? <IconSeal size={13} /> : <IconSealBroken size={13} />}
        dot
        tone={stale ? "alarm" : sealed ? "safe" : "muted"}
        seam
        value={
          sealed ? (
            <span className={stale ? "text-alarm" : "text-safe"}>{signature}</span>
          ) : (
            <span className="text-ink-faint">（空のまま）</span>
          )
        }
      />
    </div>
  )
}

/**
 * payload を JSON に戻して見せる。
 *
 * `base` を渡すと、そこから変わった行だけ色が付く。「Base64url を戻すと読めるし、書き換えも
 * できる」という話は、変わった行が 1 行だけ光るのがいちばん早い。
 */
export function ClaimsView({ claims, base }: { claims: JwtClaims; base?: JwtClaims }) {
  const baseLines = base ? new Set(JSON.stringify(base, null, 2).split("\n")) : null

  // 同じ中身の行（"}" など）が複数あるので、行そのものに何度目かを添えて鍵にする。
  const seen = new Map<string, number>()
  const rows = JSON.stringify(claims, null, 2)
    .split("\n")
    .map((line) => {
      const nth = (seen.get(line) ?? 0) + 1
      seen.set(line, nth)
      return { line, key: `${nth}:${line}`, changed: baseLines !== null && !baseLines.has(line) }
    })

  return (
    <pre className="overflow-x-auto rounded-lg border border-line-soft bg-paper py-1.5 font-mono text-[11px] leading-relaxed">
      {rows.map((row) => (
        <div
          key={row.key}
          className={`px-2.5 ${
            row.changed ? "patched bg-alarm/10 font-bold text-alarm" : "text-ink-soft"
          }`}
        >
          {row.line}
        </div>
      ))}
    </pre>
  )
}
