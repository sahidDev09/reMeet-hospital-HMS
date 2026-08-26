import { totalsOf } from '@/lib/totals'
import { doctors, invoices, patients } from './fixtures'
import { clone, delay, matches, paginate } from './store'
import type {
  Invoice,
  InvoiceKind,
  InvoiceLine,
  InvoiceQuery,
  InvoiceView,
  Paginated,
  PaymentMethod,
} from './types'

function hydrate(inv: Invoice): InvoiceView | null {
  const patient = patients.find((p) => p.id === inv.patientId)
  if (!patient) return null
  const doctor = inv.doctorId ? doctors.find((d) => d.id === inv.doctorId) : undefined
  return { ...inv, patient, doctor }
}

export async function listInvoices(q: InvoiceQuery = {}): Promise<Paginated<InvoiceView>> {
  await delay()
  const rows = invoices
    .filter((i) => (q.status ? i.status === q.status : true))
    .filter((i) => (q.kind ? i.kind === q.kind : true))
    .map(hydrate)
    .filter((i): i is InvoiceView => i !== null)
    .filter((i) => matches(q.search, i.code, i.patient.name, i.patient.mrn))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))

  return clone(paginate(rows, q.page, q.pageSize ?? 15))
}

export async function getInvoice(id: string): Promise<InvoiceView | null> {
  await delay(60)
  const found = invoices.find((i) => i.id === id)
  return found ? clone(hydrate(found)) : null
}

export async function invoicesForPatient(patientId: string): Promise<InvoiceView[]> {
  await delay(70)
  return clone(
    invoices
      .filter((i) => i.patientId === patientId)
      .map(hydrate)
      .filter((i): i is InvoiceView => i !== null)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
  )
}

/** Headline figures for the billing page's summary strip. */
export async function billingSummary(): Promise<{
  collectedToday: number
  outstanding: number
  unpaidCount: number
  invoicesToday: number
}> {
  await delay(60)
  const todayKey = new Date().toISOString().slice(0, 10)
  let collectedToday = 0
  let outstanding = 0
  let unpaidCount = 0
  let invoicesToday = 0

  for (const inv of invoices) {
    const { total } = totalsOf(inv.lines, inv.discountPct, inv.taxPct)
    if (inv.issuedAt.slice(0, 10) === todayKey) {
      invoicesToday++
      collectedToday += inv.paidAmount
    }
    if (inv.status !== 'paid' && inv.status !== 'refunded') {
      outstanding += total - inv.paidAmount
      unpaidCount++
    }
  }

  return { collectedToday, outstanding, unpaidCount, invoicesToday }
}

export async function createInvoice(input: {
  patientId: string
  doctorId?: string
  kind: InvoiceKind
  lines: InvoiceLine[]
  discountPct?: number
  taxPct?: number
}): Promise<InvoiceView> {
  await delay(180)
  const record: Invoice = {
    id: `inv_${String(invoices.length + 1).padStart(4, '0')}`,
    code: `INV-${new Date().getFullYear()}-${String(7200 + invoices.length * 4).padStart(5, '0')}`,
    patientId: input.patientId,
    doctorId: input.doctorId,
    kind: input.kind,
    lines: input.lines,
    discountPct: input.discountPct ?? 0,
    taxPct: input.taxPct ?? 0,
    status: 'unpaid',
    issuedAt: new Date().toISOString(),
    paidAmount: 0,
  }
  invoices.unshift(record)
  return clone(hydrate(record)!)
}

/**
 * Takes payment. A partial amount records as `partial` rather than being
 * rejected — the front desk does accept part payment, and pretending otherwise
 * would force staff to work around the system.
 */
export async function payInvoice(
  id: string,
  amount: number,
  method: PaymentMethod,
): Promise<InvoiceView | null> {
  await delay(160)
  const index = invoices.findIndex((i) => i.id === id)
  if (index === -1) return null

  const current = invoices[index]!
  const { total } = totalsOf(current.lines, current.discountPct, current.taxPct)
  const paidAmount = Math.min(total, current.paidAmount + Math.max(0, amount))
  const settled = paidAmount >= total

  invoices[index] = {
    ...current,
    paidAmount,
    method,
    status: settled ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    paidAt: settled ? new Date().toISOString() : current.paidAt,
  }
  return clone(hydrate(invoices[index]!))
}
