import type { Metadata } from 'next'
import { CalendarDays, Stethoscope, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { StatCard } from '@/components/app/stat-card'
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { requireRole } from '@/lib/auth/roles'
import { dashboardStats, departmentSplit } from '@/lib/data/analytics'
import { liveQueue } from '@/lib/data/appointments'
import { billingSummary, listInvoices } from '@/lib/data/billing'
import { inventoryAlerts } from '@/lib/data/pharmacy'
import { CURRENCY, money, num, time } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  await requireRole('admin', 'staff')

  const [stats, queue, split, alerts, billing, invoices] = await Promise.all([
    dashboardStats(),
    liveQueue(),
    departmentSplit(),
    inventoryAlerts(),
    billingSummary(),
    listInvoices({ pageSize: 6 }),
  ])

  const needsAttention = alerts.expired.length + alerts.out.length
  const busiest = Math.max(1, ...split.map((d) => d.value))

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Today at reMeet"
        description="Live figures across the clinic. Everything here reads the same records the desks do."
        action={
          <Button asChild>
            <Link href="/appointments">Open appointments</Link>
          </Button>
        }
      />

      <Reveal stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div data-reveal>
          <StatCard
            label="Collected today"
            value={stats.revenueToday}
            prefix={`${CURRENCY.symbol} `}
            changePct={stats.revenueChangePct}
            trend={stats.revenueTrend}
            icon={TrendingUp}
            footnote="Consultations, labs and pharmacy combined"
          />
        </div>
        <div data-reveal>
          <StatCard
            label="Appointments today"
            value={stats.appointmentsToday}
            changePct={stats.appointmentsChangePct}
            trend={stats.appointmentsTrend}
            icon={CalendarDays}
            footnote={`${queue.length} waiting or in consult now`}
          />
        </div>
        <div data-reveal>
          <StatCard
            label="Patient records"
            value={stats.patientsTotal}
            changePct={stats.patientsChangePct}
            trend={stats.patientsTrend}
            icon={Users}
            footnote="New registrations, week on week"
          />
        </div>
        <div data-reveal>
          <StatCard
            label="Doctors on duty"
            value={stats.doctorsOnDuty}
            trend={stats.doctorsTrend}
            icon={Stethoscope}
            footnote={`of ${stats.doctorsTotal} on the roster`}
          />
        </div>
      </Reveal>

      {needsAttention > 0 ? (
        <Reveal className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-4 py-3">
            <p className="text-sm text-ink">
              <span className="font-medium">{needsAttention} items need the pharmacy.</span>{' '}
              <span className="text-ink-soft">
                {alerts.expired.length} expired, {alerts.out.length} out of stock,{' '}
                {alerts.expiring.length} expiring inside 90 days.
              </span>
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/pharmacy?state=expired">Review stock</Link>
            </Button>
          </div>
        </Reveal>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        {/* --- Live queue --- */}
        <Reveal>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Live queue</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Checked in, in order of arrival at the desk.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/appointments">See all</Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              {queue.length === 0 ? (
                <EmptyState
                  className="mx-5 mb-3 border-0 py-10"
                  title="Nobody is waiting"
                  description="Patients appear here the moment the desk checks them in."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Queue</TH>
                      <TH>Patient</TH>
                      <TH>Doctor</TH>
                      <TH>Slot</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {queue.slice(0, 8).map((a) => (
                      <TR key={a.id}>
                        <TD>
                          <span className="grid size-7 place-items-center rounded-md bg-accent-soft font-mono text-[0.6875rem] font-semibold text-accent">
                            {String(a.queueNo ?? 0).padStart(2, '0')}
                          </span>
                        </TD>
                        <TD>
                          <Link
                            href={`/patients/${a.patient.id}`}
                            className="font-medium hover:text-accent"
                          >
                            {a.patient.name}
                          </Link>
                          <span className="block font-mono text-[0.6875rem] text-ink-faint">
                            {a.patient.mrn}
                          </span>
                        </TD>
                        <TD className="text-ink-soft">
                          {a.doctor.name}
                          <span className="block font-mono text-[0.6875rem] text-ink-faint">
                            Room {a.doctor.roomNo}
                          </span>
                        </TD>
                        <TD className="font-mono text-xs text-ink-soft">{time(a.start)}</TD>
                        <TD>
                          <AppointmentStatusBadge status={a.status} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* --- Department load --- */}
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Where the visits go</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">Booked visits by department.</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              {split.map((dept) => (
                <div key={dept.code} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <span className="font-mono text-[0.625rem] font-semibold tracking-[0.08em] text-accent">
                        {dept.code}
                      </span>
                      {dept.label}
                    </span>
                    <span className="font-mono text-xs text-ink-soft tabular">
                      {num(dept.value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(dept.value / busiest) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      {/* --- Money --- */}
      <Reveal className="mt-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent invoices</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                {money(billing.outstanding)} outstanding across {billing.unpaidCount} bills.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/billing">Open billing</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice</TH>
                  <TH>Patient</TH>
                  <TH>Kind</TH>
                  <TH numeric>Amount</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {invoices.items.map((inv) => {
                  const total = inv.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
                  const due = Math.round(total * (1 - inv.discountPct / 100))
                  return (
                    <TR key={inv.id}>
                      <TD>
                        <Link
                          href={`/billing/${inv.id}`}
                          className="font-mono text-xs font-medium hover:text-accent"
                        >
                          {inv.code}
                        </Link>
                      </TD>
                      <TD className="text-ink-soft">{inv.patient.name}</TD>
                      <TD className="text-ink-soft capitalize">{inv.kind}</TD>
                      <TD numeric>{money(due)}</TD>
                      <TD>
                        <PaymentStatusBadge status={inv.status} />
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </Reveal>
    </>
  )
}
