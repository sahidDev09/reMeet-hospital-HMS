'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertTriangle, Plus, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createInvoiceAction, type InvoiceState } from '@/app/actions/billing'
import { PatientPicker } from '@/components/app/patient-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, NativeSelect } from '@/components/ui/input'
import { Field, Label } from '@/components/ui/label'
import type { Doctor, InvoiceKind, Patient } from '@/lib/data/types'
import { money } from '@/lib/format'
import { lineTotal, totalsOf } from '@/lib/totals'

type Row = { key: string; label: string; detail: string; qty: number; unitPrice: number }

const KINDS: Array<{ value: InvoiceKind; label: string }> = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'mixed', label: 'Combined services' },
]

/**
 * Common charges, as starting points.
 *
 * Every one is editable after it lands on the invoice — these exist so the desk
 * types a rate when it's unusual, not every single time. Real rates come from the
 * tariff table once there's a backend to hold one.
 */
const PRESETS: Array<{ label: string; unitPrice: number }> = [
  { label: 'Registration', unitPrice: 100 },
  { label: 'Follow-up consultation', unitPrice: 500 },
  { label: 'Complete blood count (CBC)', unitPrice: 400 },
  { label: 'Blood sugar, fasting', unitPrice: 250 },
  { label: 'Chest X-ray, PA view', unitPrice: 600 },
  { label: 'ECG', unitPrice: 500 },
  { label: 'Dressing', unitPrice: 300 },
  { label: 'Cabin, per day', unitPrice: 2500 },
]

let seq = 0
function nextKey() {
  seq += 1
  return `row-${seq}`
}

/**
 * Raising an invoice by hand.
 *
 * Lines are free-form because a hospital bill is: a consultation, two tests, a
 * dressing and a cabin night all land on one sheet. The presets cover what the desk
 * types twenty times a day, and choosing a doctor offers their own fee — the one
 * number that's already on the record and shouldn't be retyped.
 */
export function InvoiceBuilder({
  doctors,
  initialPatient,
}: {
  doctors: Doctor[]
  initialPatient?: Patient | null
}) {
  const [state, action] = useActionState<InvoiceState, FormData>(createInvoiceAction, {})
  const [rows, setRows] = useState<Row[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')

  const err = (field: string) => state.fieldErrors?.[field]
  const doctor = doctors.find((d) => d.id === doctorId)

  const discountPct = Math.min(50, Math.max(0, Number(discount) || 0))
  const taxPct = Math.min(25, Math.max(0, Number(tax) || 0))
  const totals = totalsOf(rows, discountPct, taxPct)

  function add(label: string, unitPrice: number) {
    setRows((current) => [...current, { key: nextKey(), label, detail: '', qty: 1, unitPrice }])
  }

  function patch(key: string, changes: Partial<Row>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...changes } : r)))
  }

  function remove(key: string) {
    setRows((current) => current.filter((r) => r.key !== key))
  }

  return (
    <form action={action} className="grid gap-4 xl:grid-cols-[1fr_19rem] xl:items-start">
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(rows.map(({ key: _key, ...row }) => row))}
      />

      <div className="flex flex-col gap-4">
        {state.error ? (
          <div className="flex items-start gap-3 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
            <p className="text-sm font-medium text-ink">{state.error}</p>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Who and what for</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <PatientPicker initial={initialPatient} error={err('patientId')} />

            <Field label="Invoice type" htmlFor="kind" error={err('kind')}>
              <NativeSelect id="kind" name="kind" defaultValue="consultation" required>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label="Under doctor"
              htmlFor="doctorId"
              hint="Optional. Prints on the invoice and offers their fee."
              className="sm:col-span-2"
            >
              <NativeSelect
                id="doctorId"
                name="doctorId"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                <option value="">No doctor attached</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty} · {money(d.consultationFee)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Charges</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                {rows.length === 0
                  ? 'Add a common charge, or start a blank line.'
                  : `${rows.length} ${rows.length === 1 ? 'line' : 'lines'} on this invoice.`}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label className="mb-2 block">Common charges</Label>
              <div className="flex flex-wrap gap-1.5">
                {doctor ? (
                  <button
                    type="button"
                    onClick={() =>
                      add(`Consultation — ${doctor.name}`, doctor.consultationFee)
                    }
                    className="cursor-pointer rounded-md border border-accent/40 bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-accent-ink"
                  >
                    Consultation {money(doctor.consultationFee)}
                  </button>
                ) : null}
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => add(p.label, p.unitPrice)}
                    className="cursor-pointer rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
                  >
                    {p.label}{' '}
                    <span className="font-mono text-[0.6875rem] text-ink-faint">
                      {p.unitPrice}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => add('', 0)}
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
                >
                  <Plus className="size-3" />
                  Blank line
                </button>
              </div>
              {err('lines') ? (
                <p className="mt-2 text-xs font-medium text-vital-crit">{err('lines')}</p>
              ) : null}
            </div>

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-faint">
                Nothing charged yet. An invoice needs at least one line.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {rows.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-xl border border-line bg-surface-solid/40 p-3.5"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_5rem_7rem_auto] sm:items-end">
                      <Field label="Description">
                        <Input
                          value={row.label}
                          placeholder="What is being charged for"
                          aria-label="Charge description"
                          onChange={(e) => patch(row.key, { label: e.target.value })}
                        />
                      </Field>
                      <Field label="Qty">
                        <Input
                          type="number"
                          min={1}
                          max={999}
                          value={row.qty}
                          aria-label={`Quantity for ${row.label || 'this line'}`}
                          onChange={(e) =>
                            patch(row.key, { qty: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="text-center"
                        />
                      </Field>
                      <Field label="Rate">
                        <Input
                          type="number"
                          min={0}
                          value={row.unitPrice}
                          aria-label={`Rate for ${row.label || 'this line'}`}
                          onChange={(e) =>
                            patch(row.key, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
                          }
                          className="text-right"
                        />
                      </Field>
                      <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                        <span className="font-mono text-sm font-medium tabular text-ink">
                          {money(lineTotal(row))}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${row.label || 'this line'}`}
                          onClick={() => remove(row.key)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>

                    <Field label="Note on the invoice" className="mt-3">
                      <Input
                        value={row.detail}
                        placeholder="Reference, sample number, room — optional"
                        aria-label={`Note for ${row.label || 'this line'}`}
                        onChange={(e) => patch(row.key, { detail: e.target.value })}
                      />
                    </Field>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- Totals rail --- */}
      <Card className="flex flex-col gap-4 p-5 xl:sticky xl:top-20">
        <div>
          <p className="eyebrow mb-1 text-ink-faint">This invoice</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-soft">Subtotal</span>
            <span className="font-mono text-sm tabular text-ink">{money(totals.subtotal)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="discountPct">Discount %</Label>
            <Input
              id="discountPct"
              name="discountPct"
              type="number"
              min={0}
              max={50}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-20 text-right"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="taxPct">VAT %</Label>
            <Input
              id="taxPct"
              name="taxPct"
              type="number"
              min={0}
              max={25}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-20 text-right"
            />
          </div>
          <p className="text-xs text-ink-faint">Leave VAT at 0 unless the service is taxable.</p>
        </div>

        <div className="border-t border-line pt-4">
          {totals.discount > 0 ? (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-ink-faint">Discount</span>
              <span className="font-mono text-xs tabular text-vital-ok">
                − {money(totals.discount)}
              </span>
            </div>
          ) : null}
          {totals.tax > 0 ? (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-ink-faint">VAT</span>
              <span className="font-mono text-xs tabular text-ink-soft">{money(totals.tax)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink">Total</span>
            <span className="font-display text-2xl font-semibold tracking-tight tabular text-ink">
              {money(totals.total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <SubmitButton disabled={rows.length === 0} />
          <Button asChild variant="ghost">
            <Link href="/billing">Cancel</Link>
          </Button>
        </div>
        <p className="text-xs text-ink-faint">
          The invoice opens unpaid. Take payment on the next screen.
        </p>
      </Card>
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled}>
      <Save className="size-4" />
      {pending ? 'Raising…' : 'Raise invoice'}
    </Button>
  )
}
