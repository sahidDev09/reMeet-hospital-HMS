import type { Metadata } from 'next'
import { CalendarPlus, Clock, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { AppointmentStatusBadge } from '@/components/app/status-badge'
import { PulseLine } from '@/components/brand/pulse-line'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { requireRole } from '@/lib/auth/roles'
import { freeSlots, getDepartment, getDoctor } from '@/lib/data/doctors'
import { todayForDoctor } from '@/lib/data/appointments'
import { listPrescriptions } from '@/lib/data/prescriptions'
import type { Weekday } from '@/lib/data/types'
import { date, initials, money, num, time } from '@/lib/format'

const WEEK: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const doctor = await getDoctor((await params).id)
  return { title: doctor ? doctor.name : 'Doctor not found' }
}

/**
 * A doctor's page, written for whoever is holding the phone at the front desk.
 * The first question is always "when can they see someone" — so today's list and
 * the remaining free slots sit above the credentials, not below them.
 */
export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin', 'staff')

  const { id } = await params
  const doctor = await getDoctor(id)
  if (!doctor) notFound()

  const todayKey = new Date().toISOString().slice(0, 10)
  const [department, today, slots, prescriptions] = await Promise.all([
    getDepartment(doctor.department),
    todayForDoctor(doctor.id),
    freeSlots(doctor.id, todayKey),
    listPrescriptions({ doctorId: doctor.id, pageSize: 5 }),
  ])

  const seenToday = today.filter((a) => a.status === 'completed').length
  const onDutyToday = doctor.availableDays.includes(WEEK[new Date().getDay()]!)

  return (
    <>
      <PageHeader
        eyebrow={`${doctor.department} · ${department?.name ?? 'Department'}`}
        title={doctor.name}
        description={`${doctor.specialty} · ${doctor.qualifications} · BMDC ${doctor.regNo}`}
        action={
          <Button asChild>
            <Link href={`/appointments/new?doctorId=${doctor.id}`}>
              <CalendarPlus className="size-4" />
              Book with {doctor.name.split(' ').slice(-1)[0]}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem] xl:items-start">
        <div className="flex flex-col gap-4">
          {/* --- Today --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Today&rsquo;s list</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {onDutyToday
                      ? `${today.length} booked, ${seenToday} seen so far.`
                      : `Not rostered today. Next in on ${doctor.availableDays[0]}.`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                {today.length === 0 ? (
                  <EmptyState
                    className="mx-5 mb-4 border-0 py-10"
                    icon={Clock}
                    title="Nothing booked today"
                    description="The chamber is clear. Slots are open below."
                  />
                ) : (
                  <Table>
                    <THead>
                      <TR>
                        <TH>Slot</TH>
                        <TH>Patient</TH>
                        <TH>Reason</TH>
                        <TH>Status</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {today.map((a) => (
                        <TR key={a.id}>
                          <TD className="whitespace-nowrap font-mono text-xs text-ink">
                            {time(a.start)}
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
                          <TD className="text-ink-soft">{a.reason}</TD>
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

          {/* --- Free slots --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Open slots today</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {slots.length === 0
                      ? 'Fully booked.'
                      : `${slots.length} of ${doctor.slots.length} still free.`}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Nothing left today.{' '}
                    <Link
                      href={`/appointments/new?doctorId=${doctor.id}`}
                      className="font-medium text-accent hover:text-accent-hover"
                    >
                      Book another day
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <Link
                        key={slot}
                        href={`/appointments/new?doctorId=${doctor.id}&date=${todayKey}&slot=${slot}`}
                        className="rounded-lg border border-line bg-surface-solid/50 px-3 py-2 font-mono text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                      >
                        {slot}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* --- Recent prescriptions --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Recent prescriptions</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {num(prescriptions.total)} written in total.
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/prescriptions?doctorId=${doctor.id}`}>See all</Link>
                </Button>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                {prescriptions.items.length === 0 ? (
                  <EmptyState
                    className="mx-5 mb-4 border-0 py-10"
                    title="Nothing written yet"
                    description="Prescriptions appear here as consultations finish."
                  />
                ) : (
                  <Table>
                    <THead>
                      <TR>
                        <TH>Code</TH>
                        <TH>Patient</TH>
                        <TH>Diagnosis</TH>
                        <TH numeric>Items</TH>
                        <TH>Issued</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {prescriptions.items.map((rx) => (
                        <TR key={rx.id}>
                          <TD>
                            <Link
                              href={`/prescriptions/${rx.id}`}
                              className="font-mono text-xs font-medium hover:text-accent"
                            >
                              {rx.code}
                            </Link>
                          </TD>
                          <TD className="text-ink-soft">{rx.patient.name}</TD>
                          <TD className="text-ink-soft">{rx.diagnosis}</TD>
                          <TD numeric>{rx.items.length}</TD>
                          <TD className="whitespace-nowrap font-mono text-xs text-ink-soft">
                            {date(rx.issuedAt)}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* --- Rail --- */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-20">
          <Reveal>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft font-display text-base font-semibold text-accent">
                  {initials(doctor.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-ink">
                    {doctor.name}
                  </p>
                  <p className="truncate text-xs text-ink-soft">{doctor.specialty}</p>
                </div>
              </div>

              <PulseLine variant="rule" className="my-4 text-line-strong" />

              <dl className="grid grid-cols-2 gap-3">
                <Stat label="Consultation" value={money(doctor.consultationFee)} />
                <Stat label="Experience" value={`${doctor.experienceYears} yrs`} />
                <Stat label="Patients seen" value={num(doctor.patientsSeen)} />
                <Stat label="Room" value={doctor.roomNo} />
              </dl>

              <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                <a
                  href={`tel:${doctor.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 text-ink-soft hover:text-accent"
                >
                  <Phone className="size-3.5 shrink-0 text-ink-faint" />
                  <span className="font-mono text-xs">{doctor.phone}</span>
                </a>
                <a
                  href={`mailto:${doctor.email}`}
                  className="flex items-center gap-2 truncate text-ink-soft hover:text-accent"
                >
                  <Mail className="size-3.5 shrink-0 text-ink-faint" />
                  <span className="truncate text-xs">{doctor.email}</span>
                </a>
              </div>
            </Card>
          </Reveal>

          <Reveal>
            <Card className="p-5">
              <p className="eyebrow mb-3 text-ink-faint">Chamber hours</p>
              <div className="flex flex-wrap gap-1">
                {WEEK.map((day) => {
                  const on = doctor.availableDays.includes(day)
                  return (
                    <span
                      key={day}
                      className={
                        on
                          ? 'rounded-md bg-accent-soft px-2 py-1 font-mono text-[0.625rem] font-semibold text-accent'
                          : 'rounded-md px-2 py-1 font-mono text-[0.625rem] text-ink-faint/60'
                      }
                    >
                      {day.slice(0, 2)}
                    </span>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                {doctor.slots[0]} to {doctor.slots[doctor.slots.length - 1]},{' '}
                {doctor.slots.length} slots a day.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone="ok">★ {doctor.rating.toFixed(1)}</Badge>
                <span className="text-xs text-ink-faint">from patient feedback</span>
              </div>
            </Card>
          </Reveal>

          {department ? (
            <Reveal>
              <Card className="p-5">
                <p className="eyebrow mb-2 text-ink-faint">{department.code}</p>
                <p className="font-display text-sm font-semibold text-ink">{department.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{department.blurb}</p>
                <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
                  {department.services.slice(0, 4).map((s) => (
                    <li key={s} className="text-xs text-ink-soft">
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ) : null}
        </div>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-ink-faint">{label}</dt>
      <dd className="font-mono text-xs font-medium text-ink">{value}</dd>
    </div>
  )
}
