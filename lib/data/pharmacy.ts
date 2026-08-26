import { isSellable, stockState } from '@/lib/stock'
import { medicines, sales } from './fixtures'
import { clone, delay, matches, paginate } from './store'
import type {
  Medicine,
  MedicineQuery,
  Paginated,
  PaymentMethod,
  Sale,
  SaleLine,
} from './types'

/* --- Inventory ------------------------------------------------------------ */

export async function listMedicines(q: MedicineQuery = {}): Promise<Paginated<Medicine>> {
  await delay()
  const rows = medicines
    .filter((m) => matches(q.search, m.name, m.generic, m.sku, m.manufacturer, m.batchNo))
    .filter((m) => (q.form ? m.form === q.form : true))
    .filter((m) => (q.state ? stockState(m) === q.state : true))
    .sort((a, b) => a.name.localeCompare(b.name))

  return clone(paginate(rows, q.page, q.pageSize ?? 15))
}

export async function getMedicine(id: string): Promise<Medicine | null> {
  await delay(50)
  return clone(medicines.find((m) => m.id === id) ?? null)
}

/** Autocomplete source for the prescription builder and the POS scanner field. */
export async function searchMedicines(term: string, limit = 8): Promise<Medicine[]> {
  await delay(40)
  if (!term.trim()) return []
  return clone(
    medicines
      .filter((m) => matches(term, m.name, m.generic, m.sku))
      .sort((a, b) => Number(isSellable(b)) - Number(isSellable(a)))
      .slice(0, limit),
  )
}

/** Everything the pharmacist needs to act on today, in one call. */
export async function inventoryAlerts(): Promise<{
  expired: Medicine[]
  expiring: Medicine[]
  low: Medicine[]
  out: Medicine[]
}> {
  await delay(70)
  const by = (state: string) => clone(medicines.filter((m) => stockState(m) === state))
  return {
    expired: by('expired'),
    expiring: by('expiring'),
    low: by('low'),
    out: by('out'),
  }
}

export async function inventoryValue(): Promise<number> {
  await delay(20)
  return medicines.reduce((sum, m) => sum + m.stock * m.unitPrice, 0)
}

export async function adjustStock(id: string, delta: number): Promise<Medicine | null> {
  await delay(110)
  const index = medicines.findIndex((m) => m.id === id)
  if (index === -1) return null
  const current = medicines[index]!
  medicines[index] = { ...current, stock: Math.max(0, current.stock + delta) }
  return clone(medicines[index]!)
}

/* --- Point of sale -------------------------------------------------------- */

export async function listSales(limit = 20): Promise<Sale[]> {
  await delay(80)
  return clone(sales.slice(0, limit))
}

export async function getSale(id: string): Promise<Sale | null> {
  await delay(50)
  return clone(sales.find((s) => s.id === id) ?? null)
}

/**
 * Records a sale and deducts stock in the same step, because a sale that
 * doesn't move inventory is the bug this system exists to prevent. Returns the
 * receipt the POS prints.
 */
export async function recordSale(input: {
  lines: SaleLine[]
  discountPct: number
  method: PaymentMethod
  patientId?: string
  prescriptionId?: string
  cashier: string
}): Promise<Sale> {
  await delay(200)

  const subtotal = input.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const total = Math.round(subtotal * (1 - input.discountPct / 100))

  for (const line of input.lines) {
    const index = medicines.findIndex((m) => m.id === line.medicineId)
    if (index === -1) continue
    const current = medicines[index]!
    medicines[index] = { ...current, stock: Math.max(0, current.stock - line.qty) }
  }

  const sale: Sale = {
    id: `pos_${String(sales.length + 1).padStart(4, '0')}`,
    code: `POS-${new Date().getFullYear()}-${String(8800 + sales.length * 2).padStart(5, '0')}`,
    lines: input.lines,
    discountPct: input.discountPct,
    method: input.method,
    total,
    soldAt: new Date().toISOString(),
    patientId: input.patientId,
    prescriptionId: input.prescriptionId,
    cashier: input.cashier,
  }

  sales.unshift(sale)
  return clone(sale)
}
