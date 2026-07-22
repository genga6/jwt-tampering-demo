/**
 * JOSE(jose ライブラリ)による署名/検証。
 *
 * これがデモの「防御側」。ブラウザの Web Crypto を裏で使うので鍵は安全に扱える。
 *   - HS256: 対称鍵(共有シークレット)による HMAC 署名
 *   - RS256: 非対称鍵(秘密鍵で署名・公開鍵で検証)
 *
 * ポイント: 署名済みトークンの payload を1文字でも書き換えると、
 * jwtVerify は必ず例外を投げる(= 改ざんを検出できる)。
 */

import {
  type JWTPayload,
  type KeyLike,
  SignJWT,
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  errors as joseErrors,
  jwtVerify,
} from "jose"

export interface VerifyResult {
  valid: boolean
  payload?: JWTPayload
  header?: Record<string, unknown>
  error?: string
}

/** HS256 用の共有シークレットを鍵素材(バイト列)に変換する。 */
function hmacKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

/** HS256(対称鍵)でトークンに署名する。 */
export async function signHS256(payload: JWTPayload, secret: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .sign(hmacKey(secret))
}

/** HS256(対称鍵)でトークンを検証する。改ざん時は valid:false を返す。 */
export async function verifyHS256(token: string, secret: string): Promise<VerifyResult> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, hmacKey(secret))
    return { valid: true, payload, header: protectedHeader }
  } catch (err) {
    return { valid: false, error: describeJoseError(err) }
  }
}

export interface RsaKeyPair {
  publicKey: KeyLike
  privateKey: KeyLike
  /** 表示用: PEM 形式の公開鍵(SPKI)。 */
  publicPem: string
  /** 表示用: PEM 形式の秘密鍵(PKCS#8)。 */
  privatePem: string
}

/** RS256 用の鍵ペアを生成し、表示用の PEM も一緒に返す。 */
export async function generateRs256KeyPair(): Promise<RsaKeyPair> {
  const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true })
  const [publicPem, privatePem] = await Promise.all([
    exportSPKI(publicKey),
    exportPKCS8(privateKey),
  ])
  return { publicKey, privateKey, publicPem, privatePem }
}

/** RS256(秘密鍵)でトークンに署名する。 */
export async function signRS256(payload: JWTPayload, privateKey: KeyLike): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .sign(privateKey)
}

/** RS256(公開鍵)でトークンを検証する。改ざん時は valid:false を返す。 */
export async function verifyRS256(token: string, publicKey: KeyLike): Promise<VerifyResult> {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, publicKey)
    return { valid: true, payload, header: protectedHeader }
  } catch (err) {
    return { valid: false, error: describeJoseError(err) }
  }
}

/** jose の例外を、画面表示向けの分かりやすいメッセージに変換する。 */
function describeJoseError(err: unknown): string {
  if (err instanceof joseErrors.JWSSignatureVerificationFailed) {
    return "署名検証に失敗しました — payload が改ざんされたか、鍵が一致しません。"
  }
  if (err instanceof joseErrors.JWTExpired) {
    return "トークンの有効期限が切れています。"
  }
  if (err instanceof joseErrors.JOSEError) {
    return `${err.code}: ${err.message}`
  }
  return err instanceof Error ? err.message : String(err)
}
