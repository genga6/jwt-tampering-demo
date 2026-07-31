import { JwtDemo } from "./components/JwtDemo.js"
import { IconToken } from "./components/icons.js"
import { More } from "./components/ui.js"

export function App() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-5 sm:py-7">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-balance sm:text-2xl">
            <span className="text-accent">
              <IconToken size={22} />
            </span>
            JWT の中身を書き換えて見る
          </h1>
          <p className="mt-1 max-w-[62ch] text-xs leading-relaxed text-pretty text-ink-soft sm:text-sm">
            payload は Base64url で並べてあるだけで、暗号化されていない。role を user から admin
            へ書き換えた同じトークンが、サーバーの署名方式によって通るか弾かれるかが入れ替わる。
          </p>
        </div>

        <div className="text-[11px] leading-relaxed text-ink-faint">
          <More summary="このデモの前提" popover>
            <div className="space-y-1.5 rounded-xl border-[1.5px] border-line bg-card p-3 shadow-lg">
              <p>
                画面に出ているトークン・署名・鍵はすべてその場で計算した実際の値。署名・検証・鍵生成は{" "}
                <a
                  href="https://github.com/panva/jose"
                  className="font-bold text-accent underline underline-offset-2 hover:text-accent-deep"
                  target="_blank"
                  rel="noreferrer"
                >
                  jose
                </a>{" "}
                を通してブラウザの Web Crypto で行い、鍵やシークレットはこのタブから外に出ない。
              </p>
              <p>
                攻撃側の分解・再組み立ては署名を一切見ない実装にしてある（現実の脆弱なコードで
                検証なしに payload を認可へ使うのと同じ状態）。教材専用で、本番の JWT
                実装として使ってはならない。
              </p>
            </div>
          </More>
        </div>
      </header>

      <main>
        <JwtDemo />
      </main>
    </div>
  )
}
