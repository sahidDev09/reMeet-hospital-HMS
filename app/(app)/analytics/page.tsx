import type { Metadata } from 'next'
import { Activity, Pill, Stethoscope, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { StatCard } from '@/components/app/stat-card'
import { EmptyState } from '@/components/app/empty-state'
import {
  DepartmentDonut,
  RevenueArea,
  StreamBars,
  VisitBars,
} from '@/components/charts/analytics-charts'
import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { requireRole } from '@/lib/auth/roles'
import { outcomeColor, seriesColor } from '@/lib/charts'
import {
  appointmentStatusSplit,
  departmentSplit,
  doctorPerformance,
  inventoryByForm,
  patientFlowSeries,
  revenueByStream,
  revenueSeries,
  topMedicines,
} from '@/lib/data/analytics'
import { CURRENCY, money, num, percent } from '@/lib/format'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Analytics' }

/**
 * Windows, not a date picker.
 *
 * Three fixed ranges cover what anyone actually asks of this screen — this week,
 * this fortnight, this month — and they're plain links, so the page stays a server
 * component and a filtered view can be sent to someone as a URL. Thirty days is
 * the ceiling because that's how far the counter's own history goes.
 */
const RANGES = [7, 14, 30] as const
const FLOW_MAX_DAYS = 14

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  await requireRole('admin')

  const asked = Number((await searchParams).days)
  const days = (RANGES as readonly number[]).includes(asked) ? asked : 14
  const flowDays = Math.min(days, FLOW_MAX_DAYS)

  const [revenue, streams, flow, departments, outcomes, medicines, doctors, stock] =
    await Promise.all([
      revenueSeries(days),
      revenueByStream(days),
      patientFlowSeries(flowDays),
      departmentSplit(),
      appointmentStatusSplit(),
      topMedicines(8),
      doctorPerformance(),
      inventoryByForm(),
    ])

  const collected = revenue.reduce((sum, d) => sum + d.value, 0)
  const perDay = Math.round(collected / Math.max(1, days))
  const pharmacy = streams.reduce((sum, d) => sum + d.pharmacy, 0)
  const clinical = streams.reduce((sum, d) => sum + d.clinical, 0)
  const pharmacyShare = Math.round((pharmacy / Math.max(1, pharmacy + clinical)) * 100)

  const visits = flow.reduce((sum, d) => sum + d.value, 0)
  const busiest = flow.reduce((best, d) => (d.value > best.value ? d : best), flow[0] ?? {
    label: '—',
    value: 0,
  })

  const consults = doctors.reduce((sum, d) => sum + d.consults, 0)
  const outcomesTotal = outcomes.reduce((sum, o) => sum + o.value, 0)
  const stockTotal = stock.reduce((sum, s) => sum + s.value, 0)
  const busiestStock = Math.max(1, ...stock.map((s) => s.value))
  const topMedicineRevenue = Math.max(1, ...medicines.map((m) => m.revenue))

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="How the clinic is running"
        description="Revenue, visits and stock over one window. Every figure is counted from the records the desks write, not from a nightly rollup."
        action={
          <div
            role="group"
            aria-label="Reporting window"
            className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1"
          >
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/analytics?days=${range}`}
                aria-current={range === days ? 'true' : undefined}
                className={cn(
                  'rounded-lg px-3 py-1.5 font-mono text-xs transition-colors',
                  range === days
                    ? 'bg-accent text-accent-ink'
                    : 'text-ink-soft hover:bg-accent-soft hover:text-accent',
                )}
              >
                {range}d
              </Link>
            ))}
          </div>
        }
      />

      <Reveal stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div data-reveal>
          <StatCard
            label={`Collected, ${days} days`}
            value={collected}
            prefix={`${CURRENCY.symbol} `}
            trend={revenue.slice(-7).map((d) => d.value)}
            icon={TrendingUp}
            footnote={`${money(perDay)} a day on average`}
          />
        </div>
        <div data-reveal>
          <StatCard
            label="Pharmacy share"
            value={pharmacyShare}
            suffix="%"
            icon={Pill}
            footnote={`${money(pharmacy)} over the counter, ${money(clinical)} clinical`}
          />
        </div>
        <div data-reveal>
          <StatCard
            label={`Booked visits, ${flowDays} days`}
            value={visits}
            trend={flow.map((d) => d.value)}
            icon={Activity}
            footnote={`Busiest on ${busiest.label} — ${num(busiest.value)} booked`}
          />
        </div>
        <div data-reveal>
          <StatCard
            label="Consults completed"
            value={consults}
            icon={Stethoscope}
            footnote={`Across ${doctors.length} doctors, every record on file`}
          />
        </div>
      </Reveal>

      {/* --- Revenue over the window --- */}
      <Reveal className="mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Money in, day by day</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                Payments received against invoices, plus everything the counter sold.
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs text-ink-faint">
              {revenue[0]?.label} → {revenue[revenue.length - 1]?.label}
            </p>
          </CardHeader>
          <CardContent className="pt-3">
            <RevenueArea data={revenue} />
          </CardContent>
        </Card>
      </Reveal>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        {/* --- Streams --- */}
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Where the money comes from</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Consultations and labs against the pharmacy counter.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-3">
              <StreamBars data={streams} />
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                <LegendItem color="var(--chart-1)" label="Consultations & labs" value={money(clinical)} />
                <LegendItem color="var(--chart-3)" label="Pharmacy" value={money(pharmacy)} />
              </ul>
            </CardContent>
          </Card>
        </Reveal>

        {/* --- Departments --- */}
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Visits by department</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">Every booking on record, cancellations aside.</p>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <DepartmentDonut data={departments} />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* --- Patient flow --- */}
        <Reveal className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Visits per day</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  The last {flowDays} days, by weekday. Cancelled bookings are left out.
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <VisitBars data={flow} />
            </CardContent>
          </Card>
        </Reveal>

        {/* --- Outcomes --- */}
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>What happens to a booking</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  No-shows are the number worth watching here.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {outcomesTotal === 0 ? (
                <EmptyState
                  className="border-0 py-8"
                  title="Nothing booked yet"
                  description="Outcomes appear once appointments start closing."
                />
              ) : (
                <>
                  <div
                    className="flex h-2.5 overflow-hidden rounded-full bg-line"
                    role="img"
                    aria-label={outcomes
                      .map((o) => `${o.label} ${percent((o.value / outcomesTotal) * 100)}`)
                      .join(', ')}
                  >
                    {outcomes.map((o) => (
                      <span
                        key={o.label}
                        style={{
                          width: `${(o.value / outcomesTotal) * 100}%`,
                          background: outcomeColor(o.label),
                        }}
                      />
                    ))}
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {outcomes.map((o) => (
                      <LegendItem
                        key={o.label}
                        color={outcomeColor(o.label)}
                        label={o.label}
                        value={`${num(o.value)}`}
                        share={percent((o.value / outcomesTotal) * 100)}
                        block
                      />
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* --- Medicines --- */}
        <Reveal className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>What the counter sells</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Ranked by takings over the last 30 days of sales.
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {medicines.length === 0 ? (
                <EmptyState
                  className="mx-5 mb-3 border-0 py-10"
                  title="No sales recorded"
                  description="The counter's first sale puts a row here."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Medicine</TH>
                      <TH>Share of takings</TH>
                      <TH numeric>Units</TH>
                      <TH numeric>Revenue</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {medicines.map((m) => (
                      <TR key={m.medicineId}>
                        <TD className="font-medium">{m.name}</TD>
                        <TD>
                          <span className="block h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-line">
                            <span
                              className="block h-full rounded-full bg-accent"
                              style={{ width: `${(m.revenue / topMedicineRevenue) * 100}%` }}
                            />
                          </span>
                        </TD>
                        <TD numeric className="text-ink-soft">
                          {num(m.units)}
                        </TD>
                        <TD numeric>{money(m.revenue)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* --- Stock value --- */}
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Stock value on the shelf</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {money(stockTotal)} held in inventory, by form.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              {stock.map((row, i) => (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-ink">{row.label}</span>
                    <span className="font-mono text-xs tabular text-ink-soft">
                      {money(row.value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.value / busiestStock) * 100}%`,
                        background: seriesColor(i),
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* --- Doctors --- */}
      <Reveal className="mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>By doctor</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                Completed consults and the invoices raised under each name.
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <THead>
                <TR>
                  <TH>Doctor</TH>
                  <TH>Department</TH>
                  <TH numeric>Consults</TH>
                  <TH numeric>Invoiced</TH>
                  <TH numeric>Rating</TH>
                </TR>
              </THead>
              <TBody>
                {doctors.map((d) => (
                  <TR key={d.doctorId}>
                    <TD>
                      <Link
                        href={`/doctors/${d.doctorId}`}
                        className="font-medium hover:text-accent"
                      >
                        {d.name}
                      </Link>
                    </TD>
                    <TD>
                      <span className="font-mono text-[0.6875rem] font-semibold tracking-[0.08em] text-accent">
                        {d.department}
                      </span>
                    </TD>
                    <TD numeric className="text-ink-soft">
                      {num(d.consults)}
                    </TD>
                    <TD numeric>{money(d.revenue)}</TD>
                    <TD numeric className="text-ink-soft">
                      {d.rating.toFixed(1)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </Reveal>

      <p className="mt-4 text-xs text-ink-faint">
        Invoiced totals count what was billed under a doctor's name; collected figures count only
        money actually received. The two differ by whatever is still outstanding at the front desk.
      </p>
    </>
  )
}

function LegendItem({
  color,
  label,
  value,
  share,
  block = false,
}: {
  color: string
  label: string
  value: string
  share?: string
  block?: boolean
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 text-sm',
        block ? 'justify-between' : 'justify-start',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate text-ink-soft">{label}</span>
      </span>
      <span className="shrink-0 font-mono text-xs tabular text-ink">
        {value}
        {share ? <span className="ml-1.5 text-ink-faint">{share}</span> : null}
      </span>
    </li>
  )
}
