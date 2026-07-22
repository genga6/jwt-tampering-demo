import { JwtDemo } from "./components/JwtDemo.js"

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">JWT 改ざんデモ</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            JWT の payload は Base64url でエンコードされているだけ（暗号化ではない）。
            同じ改ざん（role: user → admin）を、サーバーの署名方式ごとに検証すると、
            署名なし（alg:none）では改ざんが素通りし、JOSE
            による署名では検出できる。方式を切り替えて違いを確認する。
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-500">
            適用例: OAuth 2.0 のアクセストークン、OpenID Connect の <code>id_token</code>、
            Cookie/ヘッダに載るセッション JWT、サービス間の認証トークンなど。 例の <code>role</code>{" "}
            を <code>scope</code>／<code>sub</code>／<code>aud</code>{" "}
            に置き換えれば、権限昇格やなりすましに相当する。
          </p>
        </header>

        <main>
          <JwtDemo />
        </main>

        <footer className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          署名/検証/鍵生成は{" "}
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
