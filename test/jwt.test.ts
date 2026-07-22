import { describe, expect, it } from "vitest"
import {
  generateRs256KeyPair,
  signHS256,
  signRS256,
  verifyHS256,
  verifyRS256,
} from "../src/lib/jose-crypto.js"
import { buildUnsignedToken, decodeWithoutVerification, tamperClaims } from "../src/lib/jwt.js"

describe("デモ1: 署名なし JWT は改ざんできる", () => {
  it("鍵なしで payload を書き換えて再エンコードできる", () => {
    const token = buildUnsignedToken({ alg: "none", typ: "JWT" }, { sub: "1", role: "user" })
    const forged = tamperClaims(token, { role: "admin" })
    expect(decodeWithoutVerification(forged).payload.role).toBe("admin")
  })
})

describe("デモ2: HS256 は改ざんを検出する", () => {
  const secret = "super-secret-shared-key"

  it("正規トークンは検証に成功する", async () => {
    const token = await signHS256({ sub: "1", role: "user" }, secret)
    const result = await verifyHS256(token, secret)
    expect(result.valid).toBe(true)
    expect(result.payload?.role).toBe("user")
  })

  it("改ざんトークンは検証に失敗する", async () => {
    const token = await signHS256({ sub: "1", role: "user" }, secret)
    const forged = tamperClaims(token, { role: "admin" })
    expect((await verifyHS256(forged, secret)).valid).toBe(false)
  })

  it("誤ったシークレットでは正規トークンも検証できない", async () => {
    const token = await signHS256({ sub: "1", role: "user" }, secret)
    expect((await verifyHS256(token, "attacker-guess")).valid).toBe(false)
  })
})

describe("デモ3: RS256 は公開鍵で改ざんを検出する", () => {
  it("秘密鍵署名は公開鍵検証に成功し、改ざんは失敗する", async () => {
    const keys = await generateRs256KeyPair()
    const token = await signRS256({ sub: "1", role: "user" }, keys.privateKey)
    expect((await verifyRS256(token, keys.publicKey)).valid).toBe(true)

    const forged = tamperClaims(token, { role: "admin" })
    expect((await verifyRS256(forged, keys.publicKey)).valid).toBe(false)
  })

  it("別の鍵ペアの公開鍵では検証できない", async () => {
    const issuer = await generateRs256KeyPair()
    const other = await generateRs256KeyPair()
    const token = await signRS256({ sub: "1", role: "user" }, issuer.privateKey)
    expect((await verifyRS256(token, other.publicKey)).valid).toBe(false)
  })
})
