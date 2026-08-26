/**
 * Line-item arithmetic, in one place.
 *
 * The POS cart, the invoice sheet, and the billing table all have to agree to
 * the taka on what a bill comes to. Duplicating the sum in three components is
 * how they stop agreeing, so it lives here and is deliberately pure — no
 * fixtures, no async — which means client and server both compute it identically.
 *
 * Money is handled in whole units and rounded once at the end. Rounding each
 * line would let a long bill drift by a taka or two, and a bill that doesn't add
 * up is the kind of thing a patient notices at the counter.
 */

export type Priceable = { qty: number; unitPrice: number }

export type Totals = {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export function lineTotal(line: Priceable): number {
  return line.qty * line.unitPrice
}

export function subtotalOf(lines: Priceable[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0)
}

export function totalsOf(lines: Priceable[], discountPct = 0, taxPct = 0): Totals {
  const subtotal = subtotalOf(lines)
  const discount = subtotal * (discountPct / 100)
  const taxed = subtotal - discount
  const tax = taxed * (taxPct / 100)
  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    tax: Math.round(tax),
    total: Math.round(taxed + tax),
  }
}

/** What's still owed on a part-paid bill. */
export function balanceOf(total: number, paidAmount: number): number {
  return Math.max(0, total - paidAmount)
}
