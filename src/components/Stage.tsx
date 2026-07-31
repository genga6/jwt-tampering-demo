/**
 * 盤面。
 *
 * 券が 1 枚、左の発行サーバーから経路を通って右の入口まで渡っていく様子を 1 手ずつ再生する。
 * 全部を並べて見せると読む前に諦めてしまうので、**いま何が起きているか 1 手だけ**を出す。
 *
 * 経路の真ん中に攻撃者を置いてあるのが肝。券が攻撃者の前に来た瞬間に中身が読まれ、
 * その場で書き換えられ、そのまま入口へ運ばれる ── 同じ 1 枚が同じ場所で変わっていく。
 * 入口のゲートが上がるか下がるかで結末が出る。
 *
 * base64 の文字列は盤の上では見せない。読ませても分からないので、下の折りたたみに置く。
 */

import { useEffect, useMemo, useState } from "react"
import { type JwtClaims, decodeWithoutVerification } from "../lib/jwt.js"
import { MODE_COPY, type Mode } from "../lib/modes.js"
import { type Act, type Gate, type Lane, buildActs } from "../lib/stage.js"
import { ClaimsView, MiniTicket, TokenTicket } from "./Token.js"
import {
  IconGate,
  IconGateOpen,
  IconGear,
  IconMask,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconReset,
  IconServer,
} from "./icons.js"
import { Button, More, Panel, Pill } from "./ui.js"

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

/** 自動再生で 1 手にかける時間。券が渡り切る 0.7 秒 + 読む時間。 */
const ACT_MS = 2400

/**
 * 券の停留点。
 *
 * 画面が狭いと端の停留点で券がはみ出すので、狭いときは移動幅を詰める
 * （動きが伝わればよく、端まで行く必要はない）。
 */
const LANE_X: Record<Lane, string> = {
  issuer: "left-[25%] sm:left-[18%]",
  wire: "left-1/2",
  verifier: "left-[75%] sm:left-[82%]",
}

const TONE_BOX = {
  neutral: "border-line-soft bg-paper text-ink-soft",
  danger: "border-alarm/50 bg-alarm-soft text-alarm",
  safe: "border-safe/40 bg-safe-soft text-safe",
}

export function Stage({ mode, state }: { mode: Mode; state: FlowState | null }) {
  const detected = state?.tamperedDetected ?? false
  const acts = useMemo(() => buildActs(mode, detected), [mode, detected])

  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(true)

  // 方式を変えると手順そのものが変わるので、頭から見せ直す。
  // 描画中にその場で直す形にしてあるのは、副作用で戻すと 1 度古い手を描いてしまうため。
  const [shown, setShown] = useState(acts)
  if (shown !== acts) {
    setShown(acts)
    setCursor(0)
    setPlaying(true)
  }

  useEffect(() => {
    if (!playing) return
    if (cursor >= acts.length - 1) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setCursor((c) => c + 1), ACT_MS)
    return () => clearTimeout(timer)
  }, [playing, cursor, acts.length])

  if (!state) {
    return (
      <Panel title="盤面" hint="1 手ずつ進む">
        <p className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-ink-soft">
          <span className="cranking flex text-accent">
            <IconGear size={20} />
          </span>
          鍵ペアを生成中…
        </p>
      </Panel>
    )
  }

  const index = Math.min(cursor, acts.length - 1)
  const act = acts[index] as Act
  const atEnd = index === acts.length - 1

  const issuedClaims = decodeWithoutVerification(state.issued).payload
  const forgedClaims = decodeWithoutVerification(state.forged).payload
  const claims = act.tampered ? forgedClaims : issuedClaims
  const alg = MODE_COPY[mode].alg
  const sealed = mode !== "none"

  const jump = (to: number) => {
    setPlaying(false)
    setCursor(Math.max(0, Math.min(acts.length - 1, to)))
  }

  return (
    <Panel
      title="盤面"
      hint="1 手ずつ進む"
      actions={
        <span className="font-mono text-xs text-ink-faint">
          {index + 1} / {acts.length}
        </span>
      }
    >
      <Board act={act} claims={claims} alg={alg} sealed={sealed} />

      <Wiretap act={act} claims={claims} />

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Button
          tone="accent"
          onClick={() => {
            if (atEnd && !playing) setCursor(0)
            setPlaying(!playing)
          }}
          label={playing ? "一時停止" : atEnd ? "もう一度再生" : "再生"}
        >
          {playing ? <IconPause size={16} /> : <IconPlay size={16} />}
          <span>{playing ? "一時停止" : atEnd ? "もう一度" : "再生"}</span>
        </Button>
        <Button onClick={() => jump(index - 1)} disabled={index === 0} label="前の手へ">
          <IconPrev size={16} />
        </Button>
        <Button onClick={() => jump(index + 1)} disabled={atEnd} label="次の手へ">
          <IconNext size={16} />
        </Button>
        <Button onClick={() => jump(0)} disabled={index === 0} label="最初から">
          <IconReset size={16} />
        </Button>

        <ol className="ml-auto flex items-center gap-1">
          {acts.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-label={`${i + 1} 手目: ${item.title}`}
                aria-current={i === index}
                title={`${i + 1}. ${item.title}`}
                className={`size-2.5 rounded-full border-[1.5px] transition ${
                  i === index
                    ? "border-accent-deep bg-accent"
                    : i < index
                      ? "border-line bg-line"
                      : "border-line bg-card"
                }`}
              />
            </li>
          ))}
        </ol>
      </div>

      <div
        key={act.id}
        className={`rise-in mt-2.5 rounded-xl border-[1.5px] px-3 py-2 ${TONE_BOX[act.tone]}`}
      >
        <h3 className="text-sm font-bold">{act.title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed">{act.body}</p>
      </div>

      <div className="mt-3 border-t border-line-soft pt-2.5">
        <More summary="トークンの中身を全部見る">
          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
                発行された券
              </p>
              <div className="mt-1">
                <TokenTicket token={state.issued} alg={alg} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-alarm uppercase">
                書き換えられた券
              </p>
              <div className="mt-1">
                <TokenTicket token={state.forged} alg={alg} tampered />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
                payload を Base64url から戻して並べたもの
              </p>
              <div className="mt-1">
                <ClaimsView claims={forgedClaims} base={issuedClaims} />
              </div>
            </div>
          </div>
        </More>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// 盤
// ---------------------------------------------------------------------------

function Board({
  act,
  claims,
  alg,
  sealed,
}: {
  act: Act
  claims: JwtClaims
  alg: string
  sealed: boolean
}) {
  return (
    <div className="rounded-xl border-[1.5px] border-line-soft bg-paper px-2 py-2.5">
      <div className="grid grid-cols-3 gap-1">
        <Actor
          icon={<IconServer size={22} />}
          label="発行サーバー"
          sub="券を作る"
          active={act.actor === "issuer"}
          tone="accent"
        />
        <Actor
          icon={<IconMask size={22} />}
          label="攻撃者"
          sub="経路の途中"
          active={act.actor === "attacker"}
          tone="alarm"
        />
        <GateActor gate={act.gate} active={act.actor === "verifier"} />
      </div>

      {/* 経路。券はこの線に沿って左から右へ渡っていく。 */}
      <div className="relative mt-2 h-[7.5rem] sm:h-[8rem]">
        <span
          aria-hidden
          className="absolute inset-x-4 top-2 border-t-[1.5px] border-dashed border-line"
        />
        {/* 券が進む向き。 */}
        <span aria-hidden className="absolute top-2 right-3 -translate-y-1/2 text-line">
          <IconNext size={14} />
        </span>
        {(["issuer", "wire", "verifier"] as Lane[]).map((lane) => (
          <span
            key={lane}
            aria-hidden
            className={`absolute top-2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] ${
              LANE_X[lane]
            } ${
              lane === act.lane
                ? act.actor === "attacker"
                  ? "border-alarm bg-alarm"
                  : "border-accent-deep bg-accent"
                : "border-line bg-card"
            }`}
          />
        ))}

        <div
          className={`absolute top-5 -translate-x-1/2 transition-[left] duration-700 ease-in-out motion-reduce:transition-none ${LANE_X[act.lane]}`}
        >
          <MiniTicket
            claims={claims}
            alg={alg}
            sealed={sealed}
            tampered={act.tampered}
            reading={act.reading}
          />
        </div>
      </div>
    </div>
  )
}

/** 盤の上に立っている人。手番のときだけ色が付く。 */
function Actor({
  icon,
  label,
  sub,
  active,
  tone,
}: {
  icon: React.ReactElement
  label: string
  sub: string
  active: boolean
  tone: "accent" | "alarm"
}) {
  const on = {
    accent: "border-accent bg-accent-soft text-accent-deep",
    alarm: "border-alarm bg-alarm-soft text-alarm",
  }[tone]

  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-xl border-[1.5px] px-1 py-1.5 transition ${
        active ? on : "border-transparent text-ink-faint"
      }`}
    >
      {icon}
      <span className="text-center text-[11px] leading-tight font-bold">{label}</span>
      <span className="text-center text-[10px] leading-tight text-ink-faint">{sub}</span>
    </div>
  )
}

const GATE_LABEL: Record<Gate, string> = {
  idle: "待機",
  checking: "照合中",
  open: "通してしまった",
  closed: "止めた",
}

/**
 * 入口のゲート。
 *
 * 腕が上がっている（open）のは良いことではない。改ざんされた券が通ったという意味なので、
 * 開いているときだけ赤くする。
 */
function GateActor({ gate, active }: { gate: Gate; active: boolean }) {
  const skin = {
    idle: "border-transparent text-ink-faint",
    checking: "border-accent bg-accent-soft text-accent-deep",
    open: "alarm-flash border-alarm bg-alarm-soft text-alarm",
    closed: "border-safe bg-safe-soft text-safe",
  }[gate]

  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-xl border-[1.5px] px-1 py-1.5 transition ${
        gate === "idle" && active ? "border-accent bg-accent-soft text-accent-deep" : skin
      }`}
    >
      {gate === "checking" ? (
        <span className="cranking flex">
          <IconGear size={22} />
        </span>
      ) : gate === "open" ? (
        <IconGateOpen size={22} />
      ) : (
        <IconGate size={22} />
      )}
      <span className="text-center text-[11px] leading-tight font-bold">入口（検証）</span>
      <span className="text-center text-[10px] leading-tight">{GATE_LABEL[gate]}</span>
    </div>
  )
}

/**
 * 攻撃者の窓。
 *
 * 券が経路に出た瞬間から、payload がそのまま読めていることを同じ場所に出し続ける。
 * 「暗号化されていない」という話は、ここが最初から最後まで読めていることで伝わる。
 */
function Wiretap({
  act,
  claims,
}: {
  act: Act
  claims: JwtClaims
}) {
  const onWire = act.id !== "issue"

  return (
    <div className="mt-2.5 rounded-xl border-[1.5px] border-line-soft bg-card p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-soft">
          <span className="text-alarm">
            <IconMask size={15} />
          </span>
          攻撃者に見えているもの
        </span>
        {onWire ? <Pill tone="alarm">読める</Pill> : <Pill tone="muted">まだ手元にない</Pill>}
      </div>

      {onWire && (
        <div className="mt-1.5">
          <ClaimsView claims={claims} />
        </div>
      )}

      <p
        className={`mt-1.5 text-[11px] leading-relaxed ${onWire ? "text-alarm" : "text-ink-faint"}`}
      >
        {act.wiretap}
      </p>
    </div>
  )
}
