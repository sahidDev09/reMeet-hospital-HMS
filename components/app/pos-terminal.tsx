'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Minus, Plus, Printer, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { recordSaleAction } from '@/app/actions/pharmacy'
import { MedicineSearch } from '@/components/app/medicine-search'
import { MethodPicker, methodHint } from '@/components/app/method-picker'
import { PatientPicker } from '@/components/app/patient-picker'
import { PrintButton } from '@/components/app/print-button'
import { PrintSheet } from '@/components/app/print-sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Medicine, MedicineForm, PaymentMethod, Patient, Sale } from '@/lib/data/types'
import { date, money, num, time } from '@/lib/format'
import { lineTotal, totalsOf } from '@/lib/totals'

export type CartLine = {
  medicineId: string
  name: string
  strength: string
  form: MedicineForm
  qty: number
  unitPrice: number
  /** Kept on the row so the stepper can cap itself without a round trip. */
  stock: number
}

type Receipt = { sale: Sale; patientName?: string; tendered?: number }

/**
 * The counter.
 *
 * Built for someone standing up, working by keyboard, with a queue behind the
 * patient in front of them: the search field has focus on load, Enter takes the
 * top result, and the same drug scanned twice increments a row instead of adding a
 * second one. Nothing here needs the mouse.
 *
 * The cart caps each row at what's on the shelf, and the server checks price and
 * stock again when payment is taken — the cart is a convenience, not the authority.
 */
export function PosTerminal({
  initialLines = [],
  initialPatient,
  prescriptionId,
  recent,
}: {
  initialLines?: CartLine[]
  initialPatient?: Patient | null
  prescriptionId?: string
  recent: Sale[]
}) {
  const [lines, setLines] = useState<CartLine[]>(initialLines)
  const [patient, setPatient] = useState<Patient | null>(initialPatient ?? null)
  const [discount, setDiscount] = useState('0')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [tendered, setTendered] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [pending, start] = useTransition()

  const discountPct = Math.min(50, Math.max(0, Number(discount) || 0))
  const totals = totalsOf(lines, discountPct)
  const tenderedAmount = Number(tendered) || 0
  const change = tenderedAmount - totals.total
  const shortPaid = method === 'cash' && tendered !== '' && change < 0

  function add(medicine: Medicine) {
    setError(null)
    setLines((current) => {
      const existing = current.find((l) => l.medicineId === medicine.id)
      if (!existing) {
        return [
          ...current,
          {
            medicineId: medicine.id,
            name: medicine.name,
            strength: medicine.strength,
            form: medicine.form,
            qty: 1,
            unitPrice: medicine.unitPrice,
            stock: medicine.stock,
          },
        ]
      }
      if (existing.qty >= existing.stock) {
        toast.error(`Only ${existing.stock} of ${existing.name} on the shelf.`)
        return current
      }
      return current.map((l) =>
        l.medicineId === medicine.id ? { ...l, qty: l.qty + 1 } : l,
      )
    })
  }

  function setQty(medicineId: string, qty: number) {
    setLines((current) =>
      current.map((l) =>
        l.medicineId === medicineId
          ? { ...l, qty: Math.max(1, Math.min(l.stock, Math.floor(qty) || 1)) }
          : l,
      ),
    )
  }

  function remove(medicineId: string) {
    setLines((current) => current.filter((l) => l.medicineId !== medicineId))
  }

  function takePayment() {
    setError(null)
    start(async () => {
      const result = await recordSaleAction({
        lines: lines.map((l) => ({ medicineId: l.medicineId, qty: l.qty })),
        discountPct,
        method,
        patientId: patient?.id,
        prescriptionId,
      })

      if (!result.ok || !result.sale) {
        setError(result.error ?? 'The sale did not go through.')
        return
      }

      setReceipt({
        sale: result.sale,
        patientName: patient?.name,
        tendered: method === 'cash' && tenderedAmount > 0 ? tenderedAmount : undefined,
      })
      setLines([])
      setDiscount('0')
      setTendered('')
      toast.success(`Sold. ${money(result.sale.total)} taken by ${method}.`)
    })
  }

  /* --- After payment: the memo -------------------------------------------- */

  if (receipt) {
    const { sale } = receipt
    const memo = totalsOf(sale.lines, sale.discountPct)
    return (
      <>
        <div data-print="hide" className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-ink-faint">Paid · {sale.code}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
              {money(sale.total)} taken
            </h2>
            <p className="text-sm text-ink-soft">
              {sale.lines.length} {sale.lines.length === 1 ? 'item' : 'items'} · stock deducted from
              the shelf.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setReceipt(null)}>
              New sale
            </Button>
            <PrintButton label="Print memo" />
          </div>
        </div>

        <PrintSheet docType="Cash memo" docCode={sale.code} issuedOn={date(sale.soldAt)}>
          <section className="mt-4 grid grid-cols-[1fr_auto] gap-4 border-b border-line pb-3">
            <div>
              <p className="font-display text-base font-semibold text-ink">
                {receipt.patientName ?? 'Counter sale'}
              </p>
              <p className="font-mono text-[0.6875rem] text-ink-soft">
                {date(sale.soldAt)} · {time(sale.soldAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.6875rem] text-ink-soft">Served by {sale.cashier}</p>
              <p className="font-mono text-[0.625rem] capitalize text-ink-faint">
                Paid by {sale.method === 'mobile' ? 'mobile banking' : sale.method}
              </p>
            </div>
          </section>

          <table className="mt-3 w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="eyebrow pb-1 text-left text-ink-faint">Item</th>
                <th className="eyebrow pb-1 text-right text-ink-faint">Qty</th>
                <th className="eyebrow pb-1 text-right text-ink-faint">Rate</th>
                <th className="eyebrow pb-1 text-right text-ink-faint">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((l) => (
                <tr key={l.medicineId} className="border-b border-line last:border-0">
                  <td className="py-1.5 text-xs text-ink">
                    {l.name} <span className="font-mono text-[0.6875rem]">{l.strength}</span>
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs tabular text-ink">{l.qty}</td>
                  <td className="py-1.5 text-right font-mono text-xs tabular text-ink-soft">
                    {num(l.unitPrice)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs tabular font-medium text-ink">
                    {num(lineTotal(l))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="mt-3 ml-auto w-full max-w-[52%]" data-print="keep">
            <MemoRow label="Subtotal" value={money(memo.subtotal)} />
            {memo.discount > 0 ? (
              <MemoRow label={`Discount ${sale.discountPct}%`} value={`− ${money(memo.discount)}`} />
            ) : null}
            <MemoRow label="Total" value={money(memo.total)} strong />
            {receipt.tendered ? (
              <>
                <MemoRow label="Tendered" value={money(receipt.tendered)} />
                <MemoRow label="Change" value={money(receipt.tendered - memo.total)} />
              </>
            ) : null}
          </section>

          <p className="mt-5 text-[0.6875rem] text-ink-soft">
            Keep this memo. Medicines are not returnable once they leave the counter, except on a
            pharmacist&rsquo;s advice.
          </p>
        </PrintSheet>
      </>
    )
  }

  /* --- Before payment: the terminal --------------------------------------- */

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_21rem] xl:items-start">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cart</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                {lines.length === 0
                  ? 'Scan or type a name. Enter adds the top result.'
                  : `${lines.length} ${lines.length === 1 ? 'row' : 'rows'}, ${num(
                      lines.reduce((s, l) => s + l.qty, 0),
                    )} units.`}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MedicineSearch
              onPick={add}
              label="Add to cart"
              placeholder="Scan or search — brand, generic or SKU"
              blockUnsellable
              autoFocus
              hint="Expired and out-of-stock items can't be added."
            />

            {lines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-faint">
                Nothing in the cart yet.
                {prescriptionId
                  ? ' This prescription had nothing dispensable on the shelf.'
                  : ''}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lines.map((l) => (
                  <li
                    key={l.medicineId}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-solid/40 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {l.name}{' '}
                        <span className="font-mono text-xs font-normal text-ink-soft">
                          {l.strength}
                        </span>
                      </p>
                      <p className="text-xs capitalize text-ink-faint">
                        {l.form} · {money(l.unitPrice)} each
                        {l.qty >= l.stock ? (
                          <span className="ml-1.5 font-medium text-vital-warn">
                            all {l.stock} on the shelf
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`One fewer ${l.name}`}
                        disabled={l.qty <= 1}
                        onClick={() => setQty(l.medicineId, l.qty - 1)}
                      >
                        <Minus />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={l.stock}
                        value={l.qty}
                        aria-label={`Quantity of ${l.name}`}
                        onChange={(e) => setQty(l.medicineId, Number(e.target.value))}
                        className="w-16 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`One more ${l.name}`}
                        disabled={l.qty >= l.stock}
                        onClick={() => setQty(l.medicineId, l.qty + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>

                    <p className="w-24 shrink-0 text-right font-mono text-sm font-medium tabular text-ink">
                      {money(lineTotal(l))}
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${l.name}`}
                      onClick={() => remove(l.medicineId)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {recent.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Last sales</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {recent.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-1.5 last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-xs text-ink">{s.code}</span>
                    <span className="block text-[0.6875rem] text-ink-faint">
                      {s.lines.length} {s.lines.length === 1 ? 'item' : 'items'} · {time(s.soldAt)} ·{' '}
                      {s.cashier}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge tone="neutral">
                      {s.method === 'mobile' ? 'Mobile' : s.method === 'card' ? 'Card' : 'Cash'}
                    </Badge>
                    <span className="font-mono text-sm font-medium tabular text-ink">
                      {money(s.total)}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* --- Tender rail --- */}
      <Card className="flex flex-col gap-4 p-5 xl:sticky xl:top-20">
        <PatientPicker
          label="Patient (optional)"
          initial={initialPatient}
          onChange={setPatient}
        />
        {prescriptionId ? (
          <p className="-mt-2 text-xs text-accent">Dispensing against a prescription.</p>
        ) : null}

        <div className="border-t border-line pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-soft">Subtotal</span>
            <span className="font-mono text-sm tabular text-ink">{money(totals.subtotal)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Label htmlFor="discount">Discount %</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              max={50}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-20 text-right"
            />
          </div>
          {totals.discount > 0 ? (
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xs text-ink-faint">Taken off</span>
              <span className="font-mono text-xs tabular text-vital-ok">
                − {money(totals.discount)}
              </span>
            </div>
          ) : null}

          <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm font-medium text-ink">To pay</span>
            <span className="font-display text-2xl font-semibold tracking-tight tabular text-ink">
              {money(totals.total)}
            </span>
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <Label className="mb-2 block">Payment</Label>
          <MethodPicker value={method} onChange={setMethod} />

          {method === 'cash' ? (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="tendered">Cash taken</Label>
                <Input
                  id="tendered"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={tendered}
                  placeholder={String(totals.total)}
                  onChange={(e) => setTendered(e.target.value)}
                  className="w-28 text-right"
                />
              </div>
              {totals.total > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tenderOptions(totals.total).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTendered(String(amount))}
                      className="cursor-pointer rounded-md border border-line px-2 py-1 font-mono text-[0.6875rem] text-ink-soft transition-colors hover:border-accent hover:text-accent"
                    >
                      {num(amount)}
                    </button>
                  ))}
                </div>
              ) : null}
              {tendered !== '' ? (
                <p
                  className={
                    change < 0
                      ? 'mt-2 text-xs font-medium text-vital-crit'
                      : 'mt-2 text-xs text-ink-soft'
                  }
                >
                  {change < 0
                    ? `${money(-change)} short.`
                    : `Change ${money(change)}.`}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink-faint">{methodHint(method)}</p>
          )}
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-3.5 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
            <p className="text-sm text-ink">{error}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <Button
            type="button"
            size="lg"
            disabled={pending || lines.length === 0 || shortPaid}
            onClick={takePayment}
          >
            <Printer className="size-4" />
            {pending ? 'Taking payment…' : `Take ${money(totals.total)}`}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/pharmacy">Back to the shelf</Link>
          </Button>
        </div>
        <p className="text-xs text-ink-faint">
          Completing the sale deducts stock and prints a cash memo.
        </p>
      </Card>
    </div>
  )
}

function MemoRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={
        strong
          ? 'flex items-baseline justify-between border-t border-ink/25 py-1.5'
          : 'flex items-baseline justify-between py-0.5'
      }
    >
      <span className={strong ? 'text-xs font-semibold text-ink' : 'text-[0.6875rem] text-ink-soft'}>
        {label}
      </span>
      <span
        className={
          strong
            ? 'font-mono text-sm font-semibold tabular text-ink'
            : 'font-mono text-[0.6875rem] tabular text-ink'
        }
      >
        {value}
      </span>
    </div>
  )
}

/**
 * The notes a cashier is actually handed. Exact first, then the next round number
 * up, then the common notes — nothing below the total, since that isn't a tender.
 */
function tenderOptions(total: number): number[] {
  const candidates = [total, Math.ceil(total / 100) * 100, 500, 1000, 2000]
  return [...new Set(candidates)].filter((v) => v >= total).slice(0, 4)
}
