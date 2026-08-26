import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PayInvoice } from '@/components/app/pay-invoice'
import { PrintButton } from '@/components/app/print-button'
import { PrintSheet } from '@/components/app/print-sheet'
import { PaymentStatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/roles'
import { getInvoice } from '@/lib/data/billing'
import { age, date, dateTime, money, num } from '@/lib/format'
import { balanceOf, lineTotal, totalsOf } from '@/lib/totals'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const invoice = await getInvoice((await params).id)
  return { title: invoice ? `${invoice.code} · ${invoice.patient.name}` : 'Invoice not found' }
}

const KIND_LABEL: Record<string, string> = {
  consultation: 'Consultation',
  lab: 'Laboratory',
  pharmacy: 'Pharmacy',
  procedure: 'Procedure',
  mixed: 'Combined services',
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'cash',
  card: 'card',
  mobile: 'mobile banking',
}

/**
 * An invoice, as paper — with the till attached.
 *
 * The sheet on the left is what the patient carries away or claims against; the
 * rail on the right is where the desk takes money. Keeping them on one screen means
 * nobody has to hold a number in their head while navigating, and the rail is
 * marked `data-print="hide"` so the printed page is only ever the document.
 */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin', 'staff')

  const invoice = await getInvoice((await params).id)
  if (!invoice) notFound()

  const { patient, doctor } = invoice
  const totals = totalsOf(invoice.lines, invoice.discountPct, invoice.taxPct)
  const owed = balanceOf(totals.total, invoice.paidAmount)

  return (
    <>
      <div data-print="hide" className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-ink-faint">Invoice {invoice.code}</p>
          <h1 className="mt-1 flex items-center gap-2.5 font-display text-2xl font-semibold tracking-tight text-ink">
            {money(totals.total)}
            <PaymentStatusBadge status={invoice.status} />
          </h1>
          <p className="text-sm text-ink-soft">
            {patient.name} · raised {dateTime(invoice.issuedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/billing">
              <ArrowLeft className="size-4" />
              Ledger
            </Link>
          </Button>
          <PrintButton label="Print invoice" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem] xl:items-start">
        <PrintSheet
          docType={KIND_LABEL[invoice.kind] ?? 'Invoice'}
          docCode={invoice.code}
          issuedOn={date(invoice.issuedAt)}
        >
          {/* --- Billed to --- */}
          <section className="mt-4 grid grid-cols-[1fr_auto] gap-4 border-b border-line pb-3">
            <div>
              <p className="eyebrow text-ink-faint">Billed to</p>
              <p className="font-display text-base font-semibold text-ink">{patient.name}</p>
              <p className="font-mono text-[0.6875rem] text-ink-soft">
                {patient.mrn} · {age(patient.dob)} · {patient.gender}
              </p>
              <p className="text-[0.6875rem] leading-tight text-ink-soft">{patient.address}</p>
              <p className="font-mono text-[0.625rem] text-ink-faint">{patient.phone}</p>
            </div>
            {doctor ? (
              <div className="text-right">
                <p className="eyebrow text-ink-faint">Under</p>
                <p className="text-[0.6875rem] text-ink">{doctor.name}</p>
                <p className="font-mono text-[0.625rem] text-ink-faint">{doctor.specialty}</p>
                <p className="font-mono text-[0.625rem] text-ink-faint">Room {doctor.roomNo}</p>
              </div>
            ) : null}
          </section>

          {/* --- Lines --- */}
          <table className="mt-3 w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="eyebrow pb-1 text-left text-ink-faint">Description</th>
                <th className="eyebrow pb-1 text-right text-ink-faint">Qty</th>
                <th className="eyebrow pb-1 text-right text-ink-faint">Rate</th>
                <th className="eyebrow pb-1 text-right text-ink-faint">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="py-1.5">
                    <span className="block text-xs font-medium text-ink">{line.label}</span>
                    {line.detail ? (
                      <span className="block text-[0.625rem] text-ink-soft">{line.detail}</span>
                    ) : null}
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs tabular text-ink">
                    {line.qty}
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs tabular text-ink-soft">
                    {num(line.unitPrice)}
                  </td>
                  <td className="py-1.5 text-right font-mono text-xs font-medium tabular text-ink">
                    {num(lineTotal(line))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- Totals --- */}
          <section className="mt-3 ml-auto w-full max-w-[56%]" data-print="keep">
            <Row label="Subtotal" value={money(totals.subtotal)} />
            {totals.discount > 0 ? (
              <Row label={`Discount ${invoice.discountPct}%`} value={`− ${money(totals.discount)}`} />
            ) : null}
            {totals.tax > 0 ? (
              <Row label={`VAT ${invoice.taxPct}%`} value={money(totals.tax)} />
            ) : null}
            <Row label="Total" value={money(totals.total)} strong />
            <Row label="Paid" value={money(invoice.paidAmount)} />
            <Row label="Balance due" value={money(owed)} strong />
          </section>

          {/* --- Settlement --- */}
          <section className="mt-5 flex items-end justify-between gap-6 border-t border-line pt-3">
            <div>
              {invoice.status === 'paid' && invoice.paidAt ? (
                <p className="text-[0.6875rem] text-ink">
                  <span className="font-semibold">
                    Paid in full by {METHOD_LABEL[invoice.method ?? 'cash']} on{' '}
                    {date(invoice.paidAt)}.
                  </span>
                  <span className="block text-ink-soft">Keep this for insurance claims.</span>
                </p>
              ) : owed > 0 ? (
                <p className="text-[0.6875rem] text-ink">
                  <span className="font-semibold">{money(owed)} payable at the front desk.</span>
                  <span className="block text-ink-soft">
                    Cash, card and mobile banking are accepted.
                  </span>
                </p>
              ) : (
                <p className="text-[0.6875rem] text-ink-soft">
                  Refunded. Nothing further is due.
                </p>
              )}
            </div>

            <div className="shrink-0 text-right">
              <div className="mb-1 h-8 w-36 border-b border-ink/40" />
              <p className="text-[0.6875rem] font-semibold text-ink">Received by</p>
              <p className="font-mono text-[0.625rem] text-ink-faint">reMeet front desk</p>
            </div>
          </section>
        </PrintSheet>

        <div data-print="hide" className="xl:sticky xl:top-20">
          <PayInvoice invoiceId={invoice.id} code={invoice.code} balance={owed} />
          <p className="mt-3 text-xs text-ink-faint">
            Part payments are recorded as they come in; the invoice stays open until the balance
            reaches zero.
          </p>
        </div>
      </div>
    </>
  )
}

function Row({
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
