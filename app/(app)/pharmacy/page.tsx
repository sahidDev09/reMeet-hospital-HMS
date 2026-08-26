import type { Metadata } from 'next'
import { PackageSearch, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/app/empty-state'
import { ClearFilters, Pagination, SearchField, SelectFilter } from '@/components/app/filters'
import { PageHeader } from '@/components/app/page-header'
import { StockBadge } from '@/components/app/status-badge'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { requireRole } from '@/lib/auth/roles'
import { inventoryAlerts, inventoryValue, listMedicines } from '@/lib/data/pharmacy'
import type { MedicineForm, StockState } from '@/lib/data/types'
import { money, num } from '@/lib/format'
import { daysToExpiry, stockState } from '@/lib/stock'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pharmacy' }

const FORMS: MedicineForm[] = [
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'ointment',
  'drops',
  'inhaler',
]

/**
 * The shelf.
 *
 * Four counters at the top, and each one is a link that filters the table below
 * it — an alert you can't act on from where you're standing is just decoration.
 * Rows are banded by state rather than merely badged, because the reason to open
 * this page at all is to find the problems, and they should be visible from the
 * far side of the counter.
 */
export default async function PharmacyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; form?: string; state?: string; page?: string }>
}) {
  await requireRole('admin', 'staff')

  const params = await searchParams
  const page = Number(params.page ?? 1)

  const [{ items, total, pageSize }, alerts, value] = await Promise.all([
    listMedicines({
      search: params.q,
      form: params.form as MedicineForm | undefined,
      state: params.state as StockState | undefined,
      page,
      pageSize: 15,
    }),
    inventoryAlerts(),
    inventoryValue(),
  ])

  const filtered = Boolean(params.q || params.form || params.state)

  const counters: Array<{ state: StockState; label: string; count: number; tone: string }> = [
    {
      state: 'expired',
      label: 'Expired',
      count: alerts.expired.length,
      tone: 'text-vital-crit',
    },
    {
      state: 'expiring',
      label: 'Expiring in 90 days',
      count: alerts.expiring.length,
      tone: 'text-vital-warn',
    },
    { state: 'out', label: 'Out of stock', count: alerts.out.length, tone: 'text-vital-crit' },
    { state: 'low', label: 'Below reorder level', count: alerts.low.length, tone: 'text-vital-warn' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Counter"
        title="Pharmacy"
        description={`${num(total)} lines on the shelf, ${money(value)} at cost.`}
        action={
          <Button asChild>
            <Link href="/pos">
              <ShoppingCart className="size-4" />
              Open counter
            </Link>
          </Button>
        }
      />

      <Reveal stagger className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {counters.map((c) => (
          <div key={c.state} data-reveal>
            <Link
              href={`/pharmacy?state=${c.state}`}
              className={cn(
                'glass block rounded-xl px-4 py-3.5 transition-all hover:shadow-lift',
                params.state === c.state && 'ring-1 ring-inset ring-accent',
              )}
            >
              <p className="text-xs text-ink-soft">{c.label}</p>
              <p
                className={cn(
                  'mt-1 font-display text-2xl font-semibold tracking-tight tabular',
                  c.count === 0 ? 'text-ink-faint' : c.tone,
                )}
              >
                {c.count}
              </p>
            </Link>
          </div>
        ))}
      </Reveal>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField placeholder="Search brand, generic or SKU" className="w-full sm:w-80" />
        <SelectFilter
          param="form"
          label="Form"
          allLabel="Any form"
          options={FORMS.map((f) => ({ value: f, label: f[0]!.toUpperCase() + f.slice(1) }))}
        />
        <SelectFilter
          param="state"
          label="Shelf state"
          allLabel="Any state"
          options={[
            { value: 'ok', label: 'In stock' },
            { value: 'low', label: 'Low stock' },
            { value: 'out', label: 'Out of stock' },
            { value: 'expiring', label: 'Expiring soon' },
            { value: 'expired', label: 'Expired' },
          ]}
        />
        <ClearFilters params={['q', 'form', 'state']} />
      </div>

      <Reveal>
        <Card>
          <CardContent className="px-0 pb-2">
            {items.length === 0 ? (
              <EmptyState
                className="mx-5 mb-4 border-0 py-12"
                icon={PackageSearch}
                title={filtered ? 'Nothing on the shelf matches' : 'The shelf is empty'}
                description={
                  filtered
                    ? 'Try a generic name, or clear the filters to see everything.'
                    : 'Stock arrives with the first delivery.'
                }
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Medicine</TH>
                    <TH>SKU</TH>
                    <TH>Rack</TH>
                    <TH numeric>Stock</TH>
                    <TH numeric>Price</TH>
                    <TH>Expiry</TH>
                    <TH>State</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((m) => {
                    const state = stockState(m)
                    const days = daysToExpiry(m.expiry)
                    return (
                      <TR
                        key={m.id}
                        className={cn(
                          state === 'expired' && 'bg-vital-crit/[0.05]',
                          state === 'out' && 'bg-vital-crit/[0.035]',
                          state === 'expiring' && 'bg-vital-warn/[0.05]',
                        )}
                      >
                        <TD>
                          <span className="block font-medium text-ink">
                            {m.name}{' '}
                            <span className="font-mono text-xs font-normal text-ink-soft">
                              {m.strength}
                            </span>
                            {m.prescriptionOnly ? (
                              <span className="ml-1.5 font-mono text-[0.625rem] text-ink-faint">
                                Rx
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-xs capitalize text-ink-faint">
                            {m.generic} · {m.form} · {m.manufacturer}
                          </span>
                        </TD>
                        <TD className="font-mono text-xs text-ink-soft">{m.sku}</TD>
                        <TD className="font-mono text-xs text-ink-soft">{m.rack}</TD>
                        <TD numeric>
                          <span
                            className={cn(
                              'font-medium',
                              m.stock === 0
                                ? 'text-vital-crit'
                                : m.stock <= m.reorderLevel
                                  ? 'text-vital-warn'
                                  : 'text-ink',
                            )}
                          >
                            {num(m.stock)}
                          </span>
                          <span className="block text-[0.625rem] text-ink-faint">
                            reorder at {m.reorderLevel}
                          </span>
                        </TD>
                        <TD numeric>{money(m.unitPrice)}</TD>
                        <TD>
                          <span className="block whitespace-nowrap font-mono text-xs text-ink-soft">
                            {m.expiry}
                          </span>
                          <span className="block font-mono text-[0.625rem] text-ink-faint">
                            {days < 0 ? `${Math.abs(days)} days ago` : `in ${num(days)} days`}
                          </span>
                        </TD>
                        <TD>
                          <StockBadge medicine={m} />
                          <span className="mt-0.5 block font-mono text-[0.625rem] text-ink-faint">
                            batch {m.batchNo}
                          </span>
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

      <p className="mt-3 text-xs text-ink-faint">
        Expiry outranks stock level: a full box that has passed its date shows as expired, not in
        stock, and the counter will not sell it.
      </p>
    </>
  )
}
