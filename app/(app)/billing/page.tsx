import type { Metadata } from 'next'
import { FilePlus2, ReceiptText } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/app/empty-state'
import { ClearFilters, Pagination, SearchField, SelectFilter } from '@/components/app/filters'
import { PageHeader } from '@/components/app/page-header'
import { PaymentStatusBadge } from '@/components/app/status-badge'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR, rowInteractive } from '@/components/ui/table'
import { requireRole } from '@/lib/auth/roles'
import { billingSummary, listInvoices } from '@/lib/data/billing'
import type { InvoiceKind, PaymentStatus } from '@/lib/data/types'
import { date, money, num } from '@/lib/format'
import { balanceOf, totalsOf } from '@/lib/totals'

export const metadata: Metadata = { title: 'Billing' }

const KINDS: InvoiceKind[] = ['consultation', 'lab', 'pharmacy', 'procedure', 'mixed']

/**
 * The ledger.
 *
 * Sorted newest first and never by amount: billing is worked through in the order
 * bills arrive, and the thing being looked for is almost always "the one I raised
 * ten minutes ago". Balance gets its own column rather than being inferred from
 * total minus paid — the desk is asked "how much is left", not "how much was it".
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; kind?: string; page?: string }>
}) {
  await requireRole('admin', 'staff')

  const params = await searchParams
  const page = Number(params.page ?? 1)

  const [{ items, total, pageSize }, summary] = await Promise.all([
    listInvoices({
      search: params.q,
      status: params.status as PaymentStatus | undefined,
      kind: params.kind as InvoiceKind | undefined,
      page,
    }),
    billingSummary(),
  ])

  const filtered = Boolean(params.q || params.status || params.kind)

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Billing"
        description={`${num(total)} invoices on the ledger.`}
        action={
          <Button asChild>
            <Link href="/billing/new">
              <FilePlus2 className="size-4" />
              Raise invoice
            </Link>
          </Button>
        }
      />

      <Reveal stagger className="mb-4 grid gap-3 sm:grid-cols-3">
        <div data-reveal className="glass rounded-xl px-4 py-3.5">
          <p className="text-xs text-ink-soft">Collected today</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular text-ink">
            {money(summary.collectedToday)}
          </p>
        </div>
        <div data-reveal className="glass rounded-xl px-4 py-3.5">
          <p className="text-xs text-ink-soft">Raised today</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular text-ink">
            {num(summary.invoicesToday)}
          </p>
        </div>
        <div data-reveal>
          <Link
            href="/billing?status=unpaid"
            className="glass block rounded-xl px-4 py-3.5 transition-all hover:shadow-lift"
          >
            <p className="text-xs text-ink-soft">Outstanding</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight tabular text-vital-warn">
              {money(summary.outstanding)}
            </p>
            <p className="font-mono text-[0.6875rem] text-ink-faint">
              across {summary.unpaidCount} {summary.unpaidCount === 1 ? 'bill' : 'bills'}
            </p>
          </Link>
        </div>
      </Reveal>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField placeholder="Search invoice, patient or MRN" className="w-full sm:w-80" />
        <SelectFilter
          param="status"
          label="Payment status"
          allLabel="Any status"
          options={[
            { value: 'paid', label: 'Paid' },
            { value: 'partial', label: 'Part paid' },
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'refunded', label: 'Refunded' },
          ]}
        />
        <SelectFilter
          param="kind"
          label="Invoice type"
          allLabel="Any type"
          options={KINDS.map((k) => ({ value: k, label: k[0]!.toUpperCase() + k.slice(1) }))}
        />
        <ClearFilters params={['q', 'status', 'kind']} />
      </div>

      <Reveal>
        <Card>
          <CardContent className="px-0 pb-2">
            {items.length === 0 ? (
              <EmptyState
                className="mx-5 mb-4 border-0 py-12"
                icon={ReceiptText}
                title={filtered ? 'No invoices match those filters' : 'No invoices yet'}
                description={
                  filtered
                    ? 'Try the patient’s MRN, or clear the filters to see the whole ledger.'
                    : 'Raise the first one from a consultation, a lab test or a procedure.'
                }
                action={
                  filtered ? null : (
                    <Button asChild size="sm">
                      <Link href="/billing/new">Raise invoice</Link>
                    </Button>
                  )
                }
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Invoice</TH>
                    <TH>Patient</TH>
                    <TH>Issued</TH>
                    <TH numeric>Total</TH>
                    <TH numeric>Paid</TH>
                    <TH numeric>Balance</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((inv) => {
                    const { total: gross } = totalsOf(inv.lines, inv.discountPct, inv.taxPct)
                    const owed = balanceOf(gross, inv.paidAmount)
                    return (
                      <TR key={inv.id} className={rowInteractive}>
                        <TD>
                          <Link href={`/billing/${inv.id}`} className="block">
                            <span className="block font-mono text-xs font-medium text-ink">
                              {inv.code}
                            </span>
                            <span className="block text-xs capitalize text-ink-faint">
                              {inv.kind} · {inv.lines.length}{' '}
                              {inv.lines.length === 1 ? 'line' : 'lines'}
                            </span>
                          </Link>
                        </TD>
                        <TD>
                          <span className="block font-medium text-ink">{inv.patient.name}</span>
                          <span className="block font-mono text-[0.6875rem] text-ink-faint">
                            {inv.patient.mrn}
                            {inv.doctor ? ` · ${inv.doctor.name}` : ''}
                          </span>
                        </TD>
                        <TD className="whitespace-nowrap text-xs text-ink-soft">
                          {date(inv.issuedAt)}
                        </TD>
                        <TD numeric>{money(gross)}</TD>
                        <TD numeric className="text-ink-soft">
                          {money(inv.paidAmount)}
                        </TD>
                        <TD numeric>
                          <span className={owed > 0 ? 'font-medium text-vital-warn' : 'text-ink-faint'}>
                            {owed > 0 ? money(owed) : '—'}
                          </span>
                        </TD>
                        <TD>
                          <PaymentStatusBadge status={inv.status} />
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Pagination page={page} pageSize={pageSize} total={total} className="mt-4" />
    </>
  )
}
