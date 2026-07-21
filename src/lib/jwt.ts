/**
 * 署名を検証しない、素朴な JWT の分解/組み立て。
 *
 * ここにある関数は意図的に「危険な実装」を表現している。
 * 現実の脆弱なコードで `jwt.decode()` を検証なしに認可へ使うのと同じ。
 * 署名検証は別モジュール(jose-crypto.ts)で行う。
 */

import { base64urlDecodeJson, base64urlEncodeJson } from "./base64url.js"

export interface JwtHeader {
  alg: string
  typ?: string
  [key: string]: unknown
}

export interface JwtClaims {
  sub?: string
  name?: string
  role?: string
  iat?: number
  [key: string]: unknown
}

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtClaims
  signature: string
}

/** ヘッダ/ペイロードから署名なしトークン(alg:none, 署名部は空)を作る。 */
export function buildUnsignedToken(header: JwtHeader, payload: JwtClaims): string {
  return `${base64urlEncodeJson(header)}.${base64urlEncodeJson(payload)}.`
}

/**
 * トークンを検証せずに構造分解する(危険)。
 * 署名の正しさは一切確認しない — Base64url を読むだけ。
 */
export function decodeWithoutVerification(token: string): DecodedJwt {
  const parts = token.split(".")
  const [h, p, s] = parts
  if (!h || !p) throw new Error("JWT 形式が不正です (header.payload が必要)")
  return {
    header: base64urlDecodeJson<JwtHeader>(h),
    payload: base64urlDecodeJson<JwtClaims>(p),
    signature: s ?? "",
  }
}

/**
 * 攻撃: 既存トークンの payload クレームを書き換えて再エンコードする。
 * 署名部は元のまま残す(検証しないサーバは気づかない)。
 */
export function tamperClaims(token: string, patch: JwtClaims): string {
  const { header, payload, signature } = decodeWithoutVerification(token)
  const tampered = { ...payload, ...patch }
  return `${base64urlEncodeJson(header)}.${base64urlEncodeJson(tampered)}.${signature}`
}
