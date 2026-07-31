/**
 * サーバーの設定。
 *
 * 盤面のすぐ隣に置いてある。見る場所といじる場所を並べておくと、方式を変えた瞬間に
 * 左の 3 手が組み替わるのが同じ視野に入る。
 *
 * 鍵の入力欄は方式ごとに違うものが 1 つだけ出る（使われない欄を並べておくと、
 * どれが結果に効いているのか分からなくなる）。
 */

import type { RsaKeyPair } from "../lib/jose-crypto.js"
import { MODE_COPY, MODE_KEYS, type Mode } from "../lib/modes.js"
import { IconGear, IconKey, IconKeyPair, IconReset, IconSealBroken } from "./icons.js"
import { Button, LabeledWire, More, Panel, Pill, Segmented } from "./ui.js"

const MODE_ICON: Record<Mode, () => React.ReactElement> = {
  none: () => <IconSealBroken size={15} />,
  HS256: () => <IconKey size={15} />,
  RS256: () => <IconKeyPair size={15} />,
}

export function ModeRack({
  mode,
  onModeChange,
  secret,
  onSecretChange,
  keys,
  keyBusy,
  onRegenerateKeys,
}: {
  mode: Mode
  onModeChange: (next: Mode) => void
  secret: string
  onSecretChange: (next: string) => void
  keys: RsaKeyPair | null
  keyBusy: boolean
  onRegenerateKeys: () => void
}) {
  const copy = MODE_COPY[mode]

  return (
    <Panel title="サーバーの設定" hint="ここを変える">
      <p className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">署名の方式</p>
      <div className="mt-1">
        <Segmented
          name="signing-mode"
          value={mode}
          onChange={onModeChange}
          options={MODE_KEYS.map((key) => ({
            key,
            label: MODE_COPY[key].short,
            hint: MODE_COPY[key].keying,
          }))}
        />
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-soft">
        <span className={mode === "none" ? "mt-px text-alarm" : "mt-px text-accent"}>
          {MODE_ICON[mode]()}
        </span>
        <span className="min-w-0">{copy.keying}</span>
      </p>

      <div className="mt-3 border-t border-line-soft pt-3">
        {mode === "none" && (
          <div className="rounded-xl border-[1.5px] border-alarm/50 bg-alarm-soft px-2.5 py-2">
            <Pill tone="alarm">鍵なし</Pill>
            <p className="mt-1.5 text-[11px] leading-relaxed text-alarm">
              署名も検証もしないので、設定できるものがない。現実のサーバーが取ってはならない設定。
            </p>
          </div>
        )}

        {mode === "HS256" && (
          <label className="block">
            <span className="text-[10px] font-bold tracking-wider text-ink-faint uppercase">
              共有シークレット
            </span>
            <input
              value={secret}
              onChange={(event) => onSecretChange(event.target.value)}
              spellCheck={false}
              className="mt-1 w-full rounded-lg border-[1.5px] border-line bg-paper px-2.5 py-1.5 font-mono text-[11px] text-ink focus:border-accent focus:outline-none"
            />
            <span className="mt-1 block text-[11px] leading-relaxed text-ink-faint">
              署名にも検証にもこの 1
              本を使う。書き換えると両方が同時に変わるので、判定は変わらない。
            </span>
          </label>
        )}

        {mode === "RS256" && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onRegenerateKeys} disabled={keyBusy} label="鍵ペアを作り直す">
                {keyBusy ? (
                  <span className="cranking flex">
                    <IconGear size={15} />
                  </span>
                ) : (
                  <IconReset size={15} />
                )}
                <span>{keyBusy ? "生成中…" : "作り直す"}</span>
              </Button>
              <span className="text-[11px] text-ink-faint">RSA 2048 / このタブの中で生成</span>
            </div>

            {keys && (
              <More summary="生成された鍵を見る">
                <div className="space-y-2">
                  <LabeledWire label="公開鍵 (SPKI PEM)" value={keys.publicPem.trim()} />
                  <LabeledWire label="秘密鍵 (PKCS#8 PEM)" value={keys.privatePem.trim()} />
                </div>
              </More>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-line-soft pt-2.5">
        <More summary="3 つの方式の違い">
          <dl className="space-y-2">
            {MODE_KEYS.map((key) => (
              <div key={key}>
                <dt className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                  <span className={key === "none" ? "text-alarm" : "text-accent"}>
                    {MODE_ICON[key]()}
                  </span>
                  {MODE_COPY[key].alg}
                </dt>
                <dd className="text-[11px] leading-relaxed text-ink-soft">
                  {MODE_COPY[key].keying}
                  <span className="mt-0.5 block text-ink-faint">{MODE_COPY[key].caveat}</span>
                </dd>
              </div>
            ))}
          </dl>
        </More>
      </div>
    </Panel>
  )
}
