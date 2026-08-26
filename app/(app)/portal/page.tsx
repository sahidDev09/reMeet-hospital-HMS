import type { Metadata } from 'next'
import { CalendarCheck, Clock, FilePlus2, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppointmentActions } from '@/components/app/appointment-actions'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { AppointmentStatusBadge } from '@/components/app/status-badge'
import { PulseLine } from '@/components/brand/pulse-line'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEMO_DOCTOR_ID, requireRole } from '@/lib/auth/roles'
import { todayForDoctor } from '@/lib/data/appointments'
import { freeSlots, getDoctor } from '@/lib/data/doctors'
import { listPrescriptions } from '@/lib/data/prescriptions'
import { age, date, dosage, initials, money, time } from '@/lib/format'

export const metadata: Metadata = { title: 'My clinic' }

/**
 * The doctor portal.
 *
 * A doctor's screen has one job for eight hours: who is next, and what do I need
 * to know before they sit down. So the next patient gets a whole card at the top
 * — name, age, allergies, why they're here — and the rest of the day is a list
 * below it. Everything else on this page is one tap from that card.
 */
export default async function PortalPage() {
  await requireRole('doctor')

  const doctor = await getDoctor(DEMO_DOCTOR_ID)
  if (!doctor) notFound()

  const todayKey = new Date().toISOString().slice(0, 10)
  const [today, slots, recent] = await Promise.all([
    todayForDoctor(doctor.id),
    freeSlots(doctor.id, todayKey),
    listPrescriptions({ doctorId: doctor.id, pageSize: 4 }),
  ])

  const inConsult = today.find((a) => a.status === 'in-consult')
  const waiting = today.filter((a) => a.status === 'checked-in')
  const next = inConsult ?? waiting[0]
  const seen = today.filter((a) => a.status === 'completed').length
  const remaining = today.filter(
    (a) => a.status === 'scheduled' || a.status === 'checked-in' || a.status === 'in-consult',
  ).length

  return (
    <>
      <PageHeader
        eyebrow={`${doctor.department} · Room ${doctor.roomNo}`}
        title={`Good day, ${doctor.name}`}
        description={`${today.length} booked today · ${seen} seen · ${remaining} to go`}
        action={
          <Button asChild>
            <Link href="/prescriptions/new">
              <FilePlus2 className="size-4" />
              Write prescription
            </Link>
          </Button>
        }
      />

      {/* --- Next patient --- */}
      <Reveal>
        {next ? (
          <Card className="p-0">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <p className="eyebrow text-accent">
                  {inConsult ? 'In consult now' : 'Next in'}
                </p>
                <div className="mt-2 flex items-center gap-3.5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft font-display text-base font-semibold text-accent">
                    {initials(next.patient.name)}
                  </span>
                  <div>
                    <Link
                      href={`/patients/${next.patient.id}`}
                      className="font-display text-xl font-semibold tracking-tight text-ink hover:text-accent"
                    >
                      {next.patient.name}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {age(next.patient.dob)} · {next.patient.gender} ·{' '}
                      <span className="font-mono text-xs">{next.patient.bloodGroup}</span> ·{' '}
                      <span className="font-mono text-xs">{next.patient.mrn}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="flex items-center gap-2">
                  {next.queueNo ? (
                    <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink font-mono text-xs font-semibold">
                      {String(next.queueNo).padStart(2, '0')}
                    </span>
                  ) : null}
                  <AppointmentStatusBadge status={next.status} />
                </span>
                <span className="font-mono text-xs text-ink-soft">{time(next.start)}</span>
              </div>
            </div>

            <div className="grid gap-5 px-5 py-4 md:grid-cols-3">
              <div>
                <p className="text-[0.6875rem] text-ink-faint">Here for</p>
                <p className="mt-0.5 text-sm text-ink">{next.reason}</p>
              </div>
              <div>
                <p className="text-[0.6875rem] text-ink-faint">Allergies</p>
                {next.patient.allergies.length === 0 ? (
                  <p className="mt-0.5 text-sm text-ink-faint">None recorded</p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {next.patient.allergies.map((a) => (
                      <Badge key={a} tone="crit">
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[0.6875rem] text-ink-faint">Ongoing conditions</p>
                {next.patient.conditions.length === 0 ? (
                  <p className="mt-0.5 text-sm text-ink-faint">None recorded</p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {next.patient.conditions.map((c) => (
                      <Badge key={c} tone="warn">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
              <AppointmentActions
                id={next.id}
                status={next.status}
                patientId={next.patient.id}
                context="chamber"
              />
              <Button asChild variant="ghost" size="sm">
                <Link href={`/patients/${next.patient.id}`}>Open full record</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              className="border-0 py-12"
              icon={CalendarCheck}
              title={
                today.length === 0 ? 'Nothing booked today' : 'Everyone has been seen'
              }
              description={
                today.length === 0
                  ? `Your next chamber day is ${doctor.availableDays.join(', ')}.`
                  : `${seen} consultations done. The desk will send anyone who walks in.`
              }
            />
          </Card>
        )}
      </Reveal>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        {/* --- The rest of the day --- */}
        <Reveal>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>The rest of today</CardTitle>
                <p className="mt-0.5 text-xs text-ink-soft">
                  In slot order. Checked-in patients rise to the top of your attention, not the
                  list — the times still mean something.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {today.length === 0 ? (
                <EmptyState
                  className="border-0 py-10"
                  icon={Clock}
                  title="Empty schedule"
                  description="Slots open below if the desk needs to fit someone in."
                />
              ) : (
                today.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-solid/40 px-3.5 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="w-12 shrink-0 font-mono text-xs text-ink-soft">
                        {time(a.start)}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/patients/${a.patient.id}`}
                          className="block truncate text-sm font-medium text-ink hover:text-accent"
                        >
                          {a.patient.name}
                          {a.patient.allergies.length > 0 ? (
                            <span
                              className="ml-1.5 align-middle text-vital-crit"
                              title={`Allergic to ${a.patient.allergies.join(', ')}`}
                            >
                              ●
                            </span>
                          ) : null}
                        </Link>
                        <span className="block truncate text-xs text-ink-faint">{a.reason}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <AppointmentStatusBadge status={a.status} />
                      <AppointmentActions
                        id={a.id}
                        status={a.status}
                        patientId={a.patient.id}
                        context="chamber"
                      />
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>

        <div className="flex flex-col gap-4">
          {/* --- Day at a glance --- */}
          <Reveal>
            <Card className="p-5">
              <p className="eyebrow mb-3 text-ink-faint">Your day</p>
              <dl className="grid grid-cols-3 gap-3">
                <Figure label="Booked" value={today.length} />
                <Figure label="Seen" value={seen} />
                <Figure label="Waiting" value={waiting.length} />
              </dl>
              <PulseLine variant="rule" className="my-4 text-line-strong" />
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[0.6875rem] text-ink-faint">Open slots left</dt>
                  <dd className="font-mono text-xs font-medium text-ink">{slots.length}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] text-ink-faint">Consultation fee</dt>
                  <dd className="font-mono text-xs font-medium text-ink">
                    {money(doctor.consultationFee)}
                  </dd>
                </div>
              </dl>
              {slots.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {slots.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-line px-2 py-1 font-mono text-[0.625rem] text-ink-soft"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          </Reveal>

          {/* --- Recently written --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Recently written</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">Your last few prescriptions.</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {recent.items.length === 0 ? (
                  <EmptyState
                    className="border-0 py-8"
                    icon={Users}
                    title="Nothing written yet"
                    description="Finish a consult and it lands here."
                  />
                ) : (
                  recent.items.map((rx) => (
                    <Link
                      key={rx.id}
                      href={`/prescriptions/${rx.id}`}
                      className="group rounded-lg border border-line bg-surface-solid/40 px-3.5 py-3 transition-colors hover:border-accent/40"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium text-ink group-hover:text-accent">
                          {rx.patient.name}
                        </span>
                        <span className="shrink-0 font-mono text-[0.6875rem] text-ink-faint">
                          {date(rx.issuedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {rx.diagnosis}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                        {rx.items.slice(0, 3).map((item, i) => (
                          <span key={i} className="font-mono text-[0.6875rem] text-ink-faint">
                            {item.name} {dosage(item.dosage)}
                          </span>
                        ))}
                        {rx.items.length > 3 ? (
                          <span className="font-mono text-[0.6875rem] text-ink-faint">
                            +{rx.items.length - 3}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </>
  )
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-ink-faint">{label}</dt>
      <dd className="font-display text-2xl font-semibold tracking-tight text-ink tabular">
        {value}
      </dd>
    </div>
  )
}
