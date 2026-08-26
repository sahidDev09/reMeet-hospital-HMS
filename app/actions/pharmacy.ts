'use server'

import { revalidatePath } from 'next/cache'
import { ROLE_LABEL, getRole } from '@/lib/auth/roles'
import { getMedicine, recordSale } from '@/lib/data/pharmacy'
import type { PaymentMethod, Sale, SaleLine } from '@/lib/data/types'
import { STOCK_LABEL, isSellable, stockState } from '@/lib/stock'

const METHODS: PaymentMethod[] = ['cash', 'card', 'mobile']

export type SaleResult = { ok: boolean; error?: string; sale?: Sale }

/**
 * Taking payment at the counter.
 *
 * Two things are deliberately re-decided here rather than trusted from the cart:
 * the **price** and the **stock**. A unit price that arrives from the browser is
 * how a 480-taka inhaler gets sold for one taka, and a quantity checked only when
 * the row was added is how two counters sell the same last box. Both are read off
 * the shelf again at the moment of payment.
 */
export async function recordSaleAction(input: {
  lines: Array<{ medicineId: string; qty: number }>
  discountPct: number
  method: PaymentMethod
  patientId?: string
  prescriptionId?: string
}): Promise<SaleResult> {
  const role = await getRole()
  if (role === 'doctor') {
    return { ok: false, error: 'The counter is run from the front desk, not the chamber.' }
  }

  if (input.lines.length === 0) return { ok: false, error: 'The cart is empty.' }
  if (!METHODS.includes(input.method)) {
    return { ok: false, error: 'Choose how the patient is paying.' }
  }

  // A discount is a courtesy, not a hole in the till.
  const discountPct = Math.min(50, Math.max(0, Math.round(Number(input.discountPct) || 0)))

  const lines: SaleLine[] = []
  for (const line of input.lines) {
    const qty = Math.floor(Number(line.qty))
    if (!Number.isFinite(qty) || qty < 1) {
      return { ok: false, error: 'Every row needs a quantity of at least one.' }
    }

    const onShelf = await getMedicine(line.medicineId)
    if (!onShelf) return { ok: false, error: 'One of these items is no longer stocked.' }

    if (!isSellable(onShelf)) {
      return {
        ok: false,
        error: `${onShelf.name} can't be sold — it is ${STOCK_LABEL[stockState(onShelf)].toLowerCase()}.`,
      }
    }
    if (onShelf.stock < qty) {
      return {
        ok: false,
        error: `Only ${onShelf.stock} of ${onShelf.name} ${onShelf.stock === 1 ? 'is' : 'are'} left on the shelf.`,
      }
    }

    lines.push({
      medicineId: onShelf.id,
      name: onShelf.name,
      strength: onShelf.strength,
      qty,
      unitPrice: onShelf.unitPrice,
    })
  }

  const sale = await recordSale({
    lines,
    discountPct,
    method: input.method,
    patientId: input.patientId,
    prescriptionId: input.prescriptionId,
    cashier: ROLE_LABEL[role],
  })

  // The shelf just moved, and three other pages are showing what's on it.
  revalidatePath('/pharmacy')
  revalidatePath('/pos')
  revalidatePath('/dashboard')
  revalidatePath('/analytics')

  return { ok: true, sale }
}
