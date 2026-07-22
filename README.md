# jwt-tampering-demo

**🔗 ライブデモ: https://genga6.github.io/jwt-tampering-demo/**

[![Deploy to GitHub Pages](https://github.com/genga6/jwt-tampering-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/genga6/jwt-tampering-demo/actions/workflows/deploy.yml)

JWT の payload が **Base64url でエンコードされているだけ（暗号化ではない）** ことを実演し、
JOSE（[jose](https://github.com/panva/jose)）による署名で改ざんを検出できることをブラウザ上で確認するデモ。

署名・検証・鍵生成はすべてブラウザの Web Crypto 上で動作し、鍵やシークレットはタブの外に出ない。

## デモの内容

サーバーの署名方式をセレクタで切り替え、**同じ改ざん（`role: user → admin`）**が
方式ごとにどう扱われるかを、①発行 → ②改ざん → ③検証 の流れで確認する。

- **なし (alg:none)** — 署名を検証しない／`none` を許容するサーバーは改ざんを検出できず、
  `role: admin` の権限昇格が成立する（攻撃者は署名付きトークンを `alg:none` に格下げしてこの状態を作る）。
- **HS256（対称鍵 / 共有シークレット）** — 共有シークレットの HMAC で署名。改ざんすると HMAC が
  合わず検出できる。鍵漏洩＝偽造可能で、検証側と秘密を共有する必要がある。
- **RS256（非対称鍵 / 秘密鍵で署名・公開鍵で検証）** — 鍵ペアを生成し、秘密鍵で署名・公開鍵で検証。
  公開鍵が漏れても偽造できず、改ざんは弾かれる。

判定は全方式で「改ざんを検出できたか（〇 / ×）」に統一。

## どんなケースに当てはまるか

JWT は「トークンの**形式**」であり、次のような用途で広く使われる。いずれも
「payload を信じてよいか」は**署名検証だけ**が担保しており、このデモの話がそのまま当てはまる。

- **OAuth 2.0 のアクセストークン**（JWT 形式の場合 / RFC 9068）— API 呼び出しの認可。
  例の `role` を `scope` や `aud` に置き換えれば、権限の格上げに相当する。
- **OpenID Connect の `id_token`** — ログインユーザーの ID 証明。`sub` を書き換えれば別人へのなりすまし。
- **セッション / 認証トークン**（Cookie やヘッダに載る JWT のステートレスセッション）。
- **サービス間（マイクロサービス）の認証トークン**、**API トークン**。
- **メール確認・パスワードリセットのリンク**に埋め込む短命トークン。

## 使い方

```bash
pnpm install
pnpm dev       # http://localhost:5173
```

その他のスクリプト:

```bash
pnpm build     # tsc による型チェック + 本番ビルド
pnpm test      # vitest（3デモのロジックを検証）
pnpm lint      # biome チェック
pnpm format    # biome フォーマット
```

## 構成

| パス | 役割 |
| --- | --- |
| `src/lib/base64url.ts` | Base64url エンコード/デコード（`Buffer` 非依存のブラウザ実装） |
| `src/lib/jwt.ts` | 署名を検証しない素朴な JWT 分解/組み立て（＝脆弱な実装例） |
| `src/lib/jose-crypto.ts` | JOSE による HS256 / RS256 の署名・検証・鍵生成 |
| `src/components/JwtDemo.tsx` | 保護方式セレクタ付きのデモ本体（①発行→②改ざん→③検証） |
| `src/components/ui.tsx` | 共通 UI 部品（バッジ・トークン表示・ステップ見出しなど） |
| `test/jwt.test.ts` | 「改ざんが検証で弾かれる」ことの自動テスト |

## 技術スタック

Vite + React + TypeScript + Tailwind CSS v4 / jose / Biome / Vitest
