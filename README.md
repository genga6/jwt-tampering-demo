# jwt-tampering-demo

**🔗 ライブデモ: https://genga6.github.io/jwt-tampering-demo/**

[![Deploy to GitHub Pages](https://github.com/genga6/jwt-tampering-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/genga6/jwt-tampering-demo/actions/workflows/deploy.yml)

JWT の payload が **Base64url でエンコードされているだけ（暗号化ではない）** ことを実演し、
JOSE（[jose](https://github.com/panva/jose)）による署名で改ざんを検出できることをブラウザ上で確認するデモ。

署名・検証・鍵生成はすべてブラウザの Web Crypto 上で動作し、鍵やシークレットはタブの外に出ない。

## 3 つのデモ

1. **盗んだ JWT を alg:none に格下げして改ざん（OWASP 掲載の手口）**
   HS256 で署名された正規トークンを自動発行（＝盗まれた想定）し、header の `alg` を
   `HS256` → `none` に書き換え、payload を改ざん、署名を削除する。
   「検証しないサーバー」は受理して `role: admin` の権限昇格が成立する一方、
   「署名検証するサーバー」は改ざんを検出して拒否する対比を示す。
2. **HS256（対称鍵 / 共有シークレット）**
   共有シークレットで署名。payload を書き換えると HMAC が合わず `jwtVerify` が改ざんを検出する。
   誤ったシークレットでは正規トークンすら検証できないことも示す。
3. **RS256（非対称鍵 / 秘密鍵で署名・公開鍵で検証）**
   鍵ペアを生成し、秘密鍵で署名・公開鍵で検証。公開鍵が漏れても偽造できず、改ざんは弾かれる。

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
| `src/components/*Demo.tsx` | 各デモの UI パネル |
| `test/jwt.test.ts` | 「改ざんが検証で弾かれる」ことの自動テスト |

## 技術スタック

Vite + React + TypeScript + Tailwind CSS v4 / jose / Biome / Vitest
