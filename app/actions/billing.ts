'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getRole } from '@/lib/auth/roles'
import { createInvoice, getInvoice, payInvoice } from '@/lib/data/billing'
import type { InvoiceKind, InvoiceLine, PaymentMethod, PaymentStatus } from '@/lib/data/types'
import { money } from '@/lib/format'
import { balanceOf, totalsOf } from '@/lib/totals'

const METHODS: PaymentMethod[] = ['cash', 'card', 'mobile']
const KINDS: InvoiceKind[] = ['consultation', 'lab', 'pharmacy', 'procedure', 'mixed']

export type PayResult = {
  ok: boolean
  error?: string
  status?: PaymentStatus
  paid?: number
  balance?: number
}

/**
 * Taking payment against an invoice.
 *
 * Part payment is allowed — the front desk does take half now and half on
 * discharge, and a system that refuses it just gets worked around. Over payment
 * isn't: an amount larger than the balance is far more likely to be a typed extra
 * zero than a gift, so it comes back as a question instead of quietly capping.
 */
export async function payInvoiceAction(
  id: string,
  amount: number,
  method: PaymentMethod,
): Promise<PayResult> {
  const role = await getRole()
  if (role === 'doctor') {
    return { ok: false, error: 'Payments are taken at the front desk.' }
  }
  if (!METHODS.includes(method)) {
    return { ok: false, error: 'Choose how the patient is paying.' }
  }

  const invoice = await getInvoice(id)
  if (!invoice) return { ok: false, error: 'That invoice no longer exists.' }

  const { total } = totalsOf(invoice.lines, invoice.discountPct, invoice.taxPct)
  const owed = balanceOf(total, invoice.paidAmount)
  if (owed === 0) {
    return { ok: false, error: `${invoice.code} is already settled in full.` }
  }

  const taking = Math.round(Number(amount))
  if (!Number.isFinite(taking) || taking < 1) {
    return { ok: false, error: 'Enter the amount being paid.' }
  }
  if (taking > owed) {
    return { ok: false, error: `Only ${money(owed)} is outstanding. Enter that or less.` }
  }

  const updated = await payInvoice(id, taking, method)
  if (!updated) return { ok: false, error: 'That payment did not go through.' }

  revalidatePath('/billing')
  revalidatePath(`/billing/${id}`)
  revalidatePath(`/patients/${invoice.patientId}`)
  revalidatePath('/dashboard')
  revalidatePath('/analytics')

  return {
    ok: true,
    status: updated.status,
    paid: updated.paidAmount,
    balance: balanceOf(total, updated.paidAmount),
  }
}

export type InvoiceState = { error?: string; fieldErrors?: Record<string, string> }

/**
 * Raising an invoice.
 *
 * Lines arrive as one JSON field, the same way prescription rows do: the builder
 * adds and removes rows freely, and a flat `lines[0][label]` encoding would mean
 * reindexing every input name on every delete. The JSON is parsed and checked
 * here, never trusted.
 */
export async function createInvoiceAction(
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  const role = await getRole()
  if (role === 'doctor') {
    return { error: 'Invoices are raised at the front desk.' }
  }

  const get = (key: string) => String(formData.get(key) ?? '').trim()

  const patientId = get('patientId')
  if (!patientId) {
    return { error: 'This invoice needs a patient.', fieldErrors: { patientId: 'Choose a patient.' } }
  }

  const kind = get('kind') as InvoiceKind
  if (!KINDS.includes(kind)) {
    return { error: 'Choose what this invoice is for.', fieldErrors: { kind: 'Pick a type.' } }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(get('lines') || '[]')
  } catch {
    return { error: 'The lines on this invoice could not be read. Please re-enter them.' }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return {
      error: 'An invoice needs at least one line.',
      fieldErrors: { lines: 'Add what is being charged for.' },
    }
  }

  const lines: InvoiceLine[] = []
  for (const raw of parsed as Array<Record<string, unknown>>) {
    const label = String(raw.label ?? '').trim()
    const qty = Math.floor(Number(raw.qty))
    const unitPrice = Math.round(Number(raw.unitPrice))

    if (!label) {
      return { error: 'Every line needs a description.', fieldErrors: { lines: 'One line has no description.' } }
    }
    if (!Number.isFinite(qty) || qty < 1) {
      return { error: `Set a quantity of at least one for “${label}”.` }
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return { error: `Set a rate for “${label}”.` }
    }

    const detail = String(raw.detail ?? '').trim()
    lines.push({ label, qty, unitPrice, ...(detail ? { detail } : {}) })
  }

  const discountPct = Math.min(50, Math.max(0, Math.round(Number(get('discountPct')) || 0)))
  const taxPct = Math.min(25, Math.max(0, Math.round(Number(get('taxPct')) || 0)))
  const doctorId = get('doctorId') || undefined

  const invoice = await createInvoice({ patientId, doctorId, kind, lines, discountPct, taxPct })

  revalidatePath('/billing')
  revalidatePath(`/patients/${patientId}`)
  revalidatePath('/dashboard')

  redirect(`/billing/${invoice.id}`)
}
