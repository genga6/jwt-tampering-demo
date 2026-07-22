import { Hs256Demo } from "./components/Hs256Demo.js"
import { Rs256Demo } from "./components/Rs256Demo.js"
import { TamperDemo } from "./components/TamperDemo.js"

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">JWT 改ざんデモ</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            JWT の payload は Base64url でエンコードされているだけ(暗号化ではない)。
            署名がなければ誰でも書き換えられる一方、JOSE による署名を付けると改ざんが検出できる。 3
            つのデモでその違いをブラウザ上(Web Crypto)で確認する。
          </p>
        </header>

        <main className="space-y-8">
          <TamperDemo />
          <Hs256Demo />
          <Rs256Demo />
        </main>

        <footer className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          署名/検証は{" "}
          <a
            href="https://github.com/panva/jose"
            className="text-indigo-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            jose
          </a>{" "}
          によりブラウザの Web Crypto 上で実行。鍵やシークレットはこのタブから外に出ない。
        </footer>
      </div>
    </div>
  )
}
