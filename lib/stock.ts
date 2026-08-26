import type { Medicine, StockState } from '@/lib/data/types'

/**
 * Shelf state, derived rather than stored.
 *
 * Kept free of any fixture import so client components can call it without
 * pulling the whole inventory into the browser bundle. Expiry outranks stock
 * level: an expired box on a full shelf is still unsellable, and the inventory
 * view must say so first.
 */

export const EXPIRY_WINDOW_DAYS = 90

export function daysToExpiry(expiry: string, now = new Date()): number {
  const end = new Date(`${expiry}T00:00:00`).getTime()
  const start = new Date(now).setHours(0, 0, 0, 0)
  return Math.round((end - start) / 86_400_000)
}

export function stockState(m: Medicine, now = new Date()): StockState {
  const days = daysToExpiry(m.expiry, now)
  if (days < 0) return 'expired'
  if (days <= EXPIRY_WINDOW_DAYS) return 'expiring'
  if (m.stock === 0) return 'out'
  if (m.stock <= m.reorderLevel) return 'low'
  return 'ok'
}

export const STOCK_LABEL: Record<StockState, string> = {
  ok: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
  expiring: 'Expiring soon',
  expired: 'Expired',
}

/** Maps to the --vital-* tokens, so colour always means the same thing. */
export const STOCK_TONE: Record<StockState, 'ok' | 'warn' | 'crit' | 'neutral'> = {
  ok: 'ok',
  low: 'warn',
  out: 'crit',
  expiring: 'warn',
  expired: 'crit',
}

/** Sellable = physically present and not past its expiry date. */
export function isSellable(m: Medicine, now = new Date()): boolean {
  return m.stock > 0 && daysToExpiry(m.expiry, now) >= 0
}
