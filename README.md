# jwt-tampering-demo

**🔗 ライブデモ: https://genga6.github.io/jwt-tampering-demo/**

[![Deploy to GitHub Pages](https://github.com/genga6/jwt-tampering-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/genga6/jwt-tampering-demo/actions/workflows/deploy.yml)

JWT の payload が **Base64url でエンコードされているだけ（暗号化ではない）** ことを実演し、
JOSE（[jose](https://github.com/panva/jose)）による署名で改ざんを検出できることをブラウザ上で確認するデモ。

署名・検証・鍵生成はすべてブラウザの Web Crypto 上で動作し、鍵やシークレットはタブの外に出ない。

## デモの内容

サーバーの署名方式をセレクタで切り替え、**同じ改ざん（`role: user → admin`）**が
方式ごとにどう扱われるかを、券が発行サーバーから入口（検証）まで渡っていく盤面で 1 手ずつ確認する。

- **なし (alg:none)** — 署名を検証しない／`none` を許容するサーバーは改ざんを検出できず、
  `role: admin` の権限昇格が成立する（攻撃者は署名付きトークンを `alg:none` に格下げしてこの状態を作る）。
- **HS256（対称鍵 / 共有シークレット）** — 共有シークレットの HMAC で署名。改ざんすると HMAC が
  合わず検出できる。鍵漏洩＝偽造可能で、検証側と秘密を共有する必要がある。
- **RS256（非対称鍵 / 秘密鍵で署名・公開鍵で検証）** — 鍵ペアを生成し、秘密鍵で署名・公開鍵で検証。
  公開鍵が漏れても偽造できず、改ざんは弾かれる。

判定は全方式で「改ざんを検出できたか（〇 / ×）」に統一。

### 画面

中心にあるのは**盤面**。券（トークン）1 枚が、左の発行サーバーから経路を通って右の入口（検証）まで
渡っていく様子を、7 手に分けて 1 手ずつ再生する。経路の真ん中に攻撃者が立っているので、
券が攻撃者の前に来ると中身が読まれ、その場で `role` が書き換えられ、そのまま入口へ運ばれる。
入口のゲートが**上がる（通ってしまった）か、下がる（止めた）か**で結末が出る。

| 場所 | 出ているもの |
| --- | --- |
| ステータスバー | 署名の有無・改ざんを検出できたか・権限昇格したか |
| 盤面 | 3 人のアクター、経路を渡る券、入口のゲート、再生／前後／最初から |
| 攻撃者の窓 | 経路に出た瞬間から payload がそのまま読めていること |
| サーバーの設定 | 署名方式の切り替えと、共有シークレット／鍵ペア |
| 検証の結果・要点 | 正規の券と書き換えた券の判定、その方式について言えること |

盤の上では base64 の文字列を見せない（読ませても分からない）。券には「誰の券で、どの権限で、
封がされているか」だけを出し、`header` / `payload` / `signature` の実際の文字列と payload の
差分は盤の下の折りたたみに置いてある。

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
| `src/lib/modes.ts` | 署名方式ごとの表示文（画面の文章はここに集約） |
| `src/lib/stage.ts` | 盤面で再生する 7 手（券の位置・ゲートの状態・各手の文章） |
| `src/components/JwtDemo.tsx` | デモ本体（状態の計算・ステータスバー・画面の組み立て） |
| `src/components/Stage.tsx` | 盤面（アクター・経路を渡る券・ゲート・再生コントロール） |
| `src/components/Verdict.tsx` | 正規の券と書き換えた券の判定 |
| `src/components/Token.tsx` | 盤上を渡る券と、トークンの 3 段表示・payload の差分表示 |
| `src/components/ModeRack.tsx` | 署名方式のセレクタと、シークレット / 鍵ペアの設定 |
| `src/components/ui.tsx` | 共通 UI 部品（板・ボタン・札・切り替え・折りたたみ） |
| `src/components/icons.tsx` | 画面で使う絵記号（自前の SVG。絵文字は使わない） |
| `src/index.css` | 配色・書体・盤面の見た目（Tailwind のテーマと共通クラス） |
| `test/jwt.test.ts` | 「改ざんが検証で弾かれる」ことの自動テスト |

## 技術スタック

Vite + React + TypeScript + Tailwind CSS v4 / jose / Biome / Vitest
