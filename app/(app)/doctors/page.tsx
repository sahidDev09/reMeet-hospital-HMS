import type { Metadata } from 'next'
import { Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/app/empty-state'
import { ClearFilters, SearchField, SelectFilter } from '@/components/app/filters'
import { PageHeader } from '@/components/app/page-header'
import { PulseLine } from '@/components/brand/pulse-line'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/roles'
import { listDepartments, listDoctors } from '@/lib/data/doctors'
import type { DepartmentCode, Weekday } from '@/lib/data/types'
import { initials, money, num } from '@/lib/format'

export const metadata: Metadata = { title: 'Doctors' }

const WEEK: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * The roster.
 *
 * Cards rather than a table: the thing staff need off this page is "who can see
 * this patient, and when", which is a shape — a week of chips read faster than
 * seven columns of yes and no.
 */
export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string }>
}) {
  await requireRole('admin', 'staff')

  const params = await searchParams
  const [doctors, departments] = await Promise.all([
    listDoctors({ search: params.q, department: params.dept as DepartmentCode | undefined }),
    listDepartments(),
  ])

  const deptName = new Map(departments.map((d) => [d.code, d.name]))
  const filtered = Boolean(params.q || params.dept)

  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Doctors"
        description={`${doctors.length} on the roster across ${departments.length} departments.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField placeholder="Search name or specialty" className="w-full sm:w-80" />
        <SelectFilter
          param="dept"
          label="Department"
          allLabel="All departments"
          options={departments.map((d) => ({ value: d.code, label: d.name }))}
        />
        <ClearFilters params={['q', 'dept']} />
      </div>

      {doctors.length === 0 ? (
        <Card>
          <EmptyState
            className="border-0 py-12"
            icon={Stethoscope}
            title="No doctors match those filters"
            description="Try a specialty, or clear the filters to see the whole roster."
          />
        </Card>
      ) : (
        <Reveal stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => (
            <div key={d.id} data-reveal>
              <Card className="group flex h-full flex-col p-5">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft font-display text-base font-semibold text-accent">
                    {initials(d.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/doctors/${d.id}`}
                      className="block truncate font-display text-base font-semibold text-ink transition-colors group-hover:text-accent"
                    >
                      {d.name}
                    </Link>
                    <p className="truncate text-sm text-ink-soft">{d.specialty}</p>
                    <p className="mt-0.5 font-mono text-[0.6875rem] text-ink-faint">
                      {d.qualifications}
                    </p>
                  </div>
                  <span className="font-mono text-[0.625rem] font-semibold tracking-[0.08em] text-accent">
                    {d.department}
                  </span>
                </div>

                <PulseLine variant="rule" className="my-4 text-line-strong" />

                <dl className="grid grid-cols-3 gap-2">
                  <div>
                    <dt className="text-[0.6875rem] text-ink-faint">Fee</dt>
                    <dd className="font-mono text-xs font-medium text-ink">
                      {money(d.consultationFee)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] text-ink-faint">Experience</dt>
                    <dd className="font-mono text-xs font-medium text-ink">
                      {d.experienceYears} yrs
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] text-ink-faint">Seen</dt>
                    <dd className="font-mono text-xs font-medium text-ink">{num(d.patientsSeen)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-1">
                  {WEEK.map((day) => {
                    const on = d.availableDays.includes(day)
                    return (
                      <span
                        key={day}
                        className={
                          on
                            ? 'rounded-md bg-accent-soft px-1.5 py-1 font-mono text-[0.625rem] font-semibold text-accent'
                            : 'rounded-md px-1.5 py-1 font-mono text-[0.625rem] text-ink-faint/60'
                        }
                        title={on ? `Available ${day}` : `Off ${day}`}
                      >
                        {day.slice(0, 2)}
                      </span>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="flex items-center gap-2 text-xs text-ink-soft">
                    <Badge tone="ok">★ {d.rating.toFixed(1)}</Badge>
                    Room {d.roomNo}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/appointments/new?doctorId=${d.id}`}>Book</Link>
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </Reveal>
      )}

      {filtered ? (
        <p className="mt-4 text-xs text-ink-faint">
          Showing {doctors.length} of the roster.{' '}
          {params.dept ? `Department: ${deptName.get(params.dept as DepartmentCode)}.` : ''}
        </p>
      ) : null}
    </>
  )
}
