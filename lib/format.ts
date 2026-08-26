/**
 * Formatting helpers.
 *
 * Currency lives in one place on purpose — change CURRENCY and the whole app
 * follows, including print sheets and POS receipts.
 */

export const CURRENCY = {
  code: 'BDT',
  symbol: '৳',
  locale: 'en-BD',
} as const

/** `৳ 12,480` — no decimals, since the POS deals in whole taka. */
export function money(amount: number, opts?: { decimals?: boolean }) {
  const decimals = opts?.decimals ?? false
  return `${CURRENCY.symbol} ${amount.toLocaleString(CURRENCY.locale, {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`
}

/** Bare number with thousands separators, for when the symbol is shown separately. */
export function num(value: number) {
  return value.toLocaleString(CURRENCY.locale)
}

export function percent(value: number, decimals = 0) {
  return `${value.toFixed(decimals)}%`
}

/** `84k` / `1.2M` — for chart axes, where a full separated number won't fit. */
export function compact(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}

/** `12 Mar 2026` — unambiguous, no locale date-order confusion. */
export function date(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** `12 Mar, 2:30 pm` */
export function dateTime(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${time(d)}`
}

/** `2:30 pm` */
export function time(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  return d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
}

/** `34y` / `8m` — compact age for record headers and queue rows. */
export function age(dob: string) {
  const born = new Date(dob)
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  const monthDiff = now.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) years--
  if (years > 0) return `${years}y`
  const months = monthDiff < 0 ? monthDiff + 12 : monthDiff
  return `${months}m`
}

/**
 * Dosage in the standard morning-noon-night notation clinicians already read:
 * `1-0-1` means one in the morning, none at noon, one at night.
 */
export function dosage(d: { morning: number; noon: number; night: number }) {
  return `${d.morning}-${d.noon}-${d.night}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/** Days from today. Negative means already past. */
export function daysUntil(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  const ms = d.getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.round(ms / 86_400_000)
}

/** `in 24 days` / `3 days ago` / `today` */
export function relativeDays(input: string | Date) {
  const days = daysUntil(input)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
}
