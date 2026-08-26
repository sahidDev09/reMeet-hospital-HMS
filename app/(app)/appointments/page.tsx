import type { Metadata } from 'next'
import { CalendarPlus, CalendarX } from 'lucide-react'
import Link from 'next/link'
import { AppointmentActions } from '@/components/app/appointment-actions'
import { EmptyState } from '@/components/app/empty-state'
import { SelectFilter } from '@/components/app/filters'
import { isoDay, MonthCalendar, monthKey, parseMonth } from '@/components/app/month-calendar'
import { PageHeader } from '@/components/app/page-header'
import { AppointmentStatusBadge } from '@/components/app/status-badge'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/roles'
import { listAppointments, liveQueue, monthCounts } from '@/lib/data/appointments'
import { listDepartments } from '@/lib/data/doctors'
import type { AppointmentStatus, DepartmentCode } from '@/lib/data/types'
import { time } from '@/lib/format'

export const metadata: Metadata = { title: 'Appointments' }

/**
 * The front desk's screen.
 *
 * Two things happen here and they belong side by side: choosing a day to book
 * into, and working the people already standing in the room. The queue is on the
 * right because it changes minute to minute; the calendar on the left because it
 * doesn't.
 */
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string; status?: string; dept?: string }>
}) {
  await requireRole('admin', 'staff')

  const params = await searchParams
  const month = parseMonth(params.m)
  const selected = params.d ?? isoDay(new Date())

  const [counts, day, queue, departments] = await Promise.all([
    monthCounts(month.getFullYear(), month.getMonth()),
    listAppointments({
      on: selected,
      status: params.status as AppointmentStatus | undefined,
      department: params.dept as DepartmentCode | undefined,
    }),
    liveQueue(),
    listDepartments(),
  ])

  const selectedDate = new Date(`${selected}T00:00:00`)
  const isToday = selected === isoDay(new Date())
  const monthTotal = Object.values(counts).reduce((s, n) => s + n, 0)

  return (
    <>
      <PageHeader
        eyebrow="Care"
        title="Appointments"
        description={`${monthTotal} visits booked in ${month.toLocaleDateString('en-GB', { month: 'long' })}. ${queue.length} in the room right now.`}
        action={
          <Button asChild>
            <Link href={`/appointments/new?date=${selected}`}>
              <CalendarPlus className="size-4" />
              Book visit
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_21rem] xl:items-start">
        <div className="flex flex-col gap-4">
          <Reveal>
            <Card className="p-5">
              <MonthCalendar month={month} selected={selected} counts={counts} />
            </Card>
          </Reveal>

          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>
                    {isToday
                      ? 'Today'
                      : selectedDate.toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {day.length === 0
                      ? 'Nothing booked.'
                      : `${day.length} visit${day.length === 1 ? '' : 's'}, in slot order.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SelectFilter
                    param="status"
                    label="Status"
                    allLabel="Any status"
                    options={[
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'checked-in', label: 'Checked in' },
                      { value: 'in-consult', label: 'In consult' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                      { value: 'no-show', label: 'No show' },
                    ]}
                  />
                  <SelectFilter
                    param="dept"
                    label="Department"
                    allLabel="All departments"
                    options={departments.map((d) => ({ value: d.code, label: d.name }))}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {day.length === 0 ? (
                  <EmptyState
                    className="border-0 py-12"
                    icon={CalendarX}
                    title="Nothing booked for this day"
                    description="Pick another date on the calendar, or book someone in."
                    action={
                      <Button asChild size="sm">
                        <Link href={`/appointments/new?date=${selected}`}>Book visit</Link>
                      </Button>
                    }
                  />
                ) : (
                  day.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-solid/40 px-3.5 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="w-12 shrink-0 font-mono text-xs text-ink">
                          {time(a.start)}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/patients/${a.patient.id}`}
                            className="block truncate text-sm font-medium text-ink hover:text-accent"
                          >
                            {a.patient.name}
                          </Link>
                          <span className="block truncate text-xs text-ink-faint">
                            <span className="font-mono">{a.department}</span> · {a.doctor.name} ·{' '}
                            {a.reason}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <AppointmentStatusBadge status={a.status} />
                        <AppointmentActions
                          id={a.id}
                          status={a.status}
                          patientId={a.patient.id}
                          context="desk"
                        />
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* --- Live queue --- */}
        <Reveal>
          <Card className="xl:sticky xl:top-20">
            <CardHeader>
              <div>
                <CardTitle>In the room</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Numbers are issued at check-in and never reused.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {queue.length === 0 ? (
                <EmptyState
                  className="border-0 py-10"
                  title="Nobody waiting"
                  description="Check someone in from today's list and they appear here."
                />
              ) : (
                queue.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface-solid/40 px-3 py-2.5"
                  >
                    <span
                      className={
                        a.status === 'in-consult'
                          ? 'grid size-8 shrink-0 place-items-center rounded-lg bg-accent font-mono text-xs font-semibold text-accent-ink'
                          : 'grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-xs font-semibold text-accent'
                      }
                    >
                      {String(a.queueNo ?? 0).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/patients/${a.patient.id}`}
                        className="block truncate text-sm font-medium text-ink hover:text-accent"
                      >
                        {a.patient.name}
                      </Link>
                      <span className="block truncate font-mono text-[0.6875rem] text-ink-faint">
                        {a.doctor.name} · Room {a.doctor.roomNo}
                      </span>
                    </span>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Viewing {monthKey(month)}. Calendar days link by URL, so this view can be shared as it
        stands.
      </p>
    </>
  )
}
