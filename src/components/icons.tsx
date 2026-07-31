/**
 * 画面で使う絵記号。
 *
 * 絵文字は環境ごとに形も色も変わってしまうので、必要なものだけ自分で描いている。
 * すべて 24×24 の枠・線は currentColor なので、置いた場所の文字色に馴染む。
 */

import type { ReactNode } from "react"

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export type IconProps = { size?: number }

/** トークン。切り取り線の入った 1 枚の券。 */
export function IconToken({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M2.5 8.2V6.5a1.5 1.5 0 0 1 1.5-1.5h16a1.5 1.5 0 0 1 1.5 1.5v1.7a2 2 0 0 0 0 7.6v1.7a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-1.7a2 2 0 0 0 0-7.6Z" />
      <path d="M9.2 7.5v9M14.8 7.5v9" strokeDasharray="2 2.4" />
    </Icon>
  )
}

/** 封がされている（署名がある）。 */
export function IconSeal({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 2.9l2.4 1.5 2.8-.3 1 2.6 2.3 1.7-1 2.6 1 2.6-2.3 1.7-1 2.6-2.8-.3L12 19.7l-2.4-1.5-2.8.3-1-2.6L3.5 14l1-2.6-1-2.6 2.3-1.7 1-2.6 2.8.3Z" />
      <path d="M9.3 11.9l1.9 1.9 3.6-3.8" />
    </Icon>
  )
}

/** 封がない（alg:none / 署名を見ていない）。 */
export function IconSealBroken({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 2.9l2.4 1.5 2.8-.3 1 2.6 2.3 1.7-1 2.6 1 2.6-2.3 1.7-1 2.6-2.8-.3L12 19.7l-2.4-1.5-2.8.3-1-2.6L3.5 14l1-2.6-1-2.6 2.3-1.7 1-2.6 2.8.3Z" />
      <path d="M12.7 6.2l-2 4.8 2.8 1.1-2.2 5.1" />
    </Icon>
  )
}

/** サーバー側。ラックに積まれた 2 台。 */
export function IconServer({ size }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="3" y="4" width="18" height="7" rx="1.8" />
      <rect x="3" y="13" width="18" height="7" rx="1.8" />
      <path d="M6.5 7.5h.01M6.5 16.5h.01" />
      <path d="M10 7.5h6M10 16.5h6" />
    </Icon>
  )
}

/** 攻撃者。 */
export function IconMask({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M2.6 8.4C5 7.2 8.4 6.6 12 6.6s7 .6 9.4 1.8c-.3 4.6-2 7.4-4.6 7.4-1.8 0-3-1-4.8-1-1.8 0-3 1-4.8 1-2.6 0-4.3-2.8-4.6-7.4Z" />
      <path d="M7.6 10.6h1.6M14.8 10.6h1.6" />
    </Icon>
  )
}

/** 中身が読めている（Base64url は暗号化ではない）。 */
export function IconEye({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Icon>
  )
}

/** 共有シークレット（対称鍵）。1 本の鍵を両方が持つ。 */
export function IconKey({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11l8.5 8.5M15.5 15l-2 2 2 2 2-2" />
    </Icon>
  )
}

/** 鍵ペア（非対称鍵）。噛み合う 2 本。 */
export function IconKeyPair({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="6.6" cy="7" r="3.4" />
      <path d="M9 9.4l4.4 4.4" />
      <circle cx="17.4" cy="17" r="3.4" />
      <path d="M15 14.6 10.6 10.2" />
    </Icon>
  )
}

/** 書き換え。ペン先。 */
export function IconPen({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M16.4 3.9l3.7 3.7-11 11-4.6.9.9-4.6 11-11Z" />
      <path d="M14.4 5.9l3.7 3.7" />
    </Icon>
  )
}

/** 手元での計算（署名・検証）。 */
export function IconGear({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 12H2.1M21.9 12h-2.4M6.7 6.7 5 5M19 19l-1.7-1.7M6.7 17.3 5 19M19 5l-1.7 1.7" />
    </Icon>
  )
}

/** 受理した。 */
export function IconCheck({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.6 2.6L16 9.4" />
    </Icon>
  )
}

/** 拒否した。 */
export function IconCross({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </Icon>
  )
}

/** 作り直す。 */
export function IconReset({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4.4V10h5.4" />
    </Icon>
  )
}
