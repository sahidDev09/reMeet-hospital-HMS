import type { Metadata } from 'next'
import {
  AlertTriangle,
  CalendarPlus,
  FilePlus2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/app/page-header'
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/app/status-badge'
import { EmptyState } from '@/components/app/empty-state'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { listAppointments } from '@/lib/data/appointments'
import { invoicesForPatient } from '@/lib/data/billing'
import { getPatient } from '@/lib/data/patients'
import { prescriptionsForPatient } from '@/lib/data/prescriptions'
import { age, date, dateTime, dosage, initials, money, relativeDays, time } from '@/lib/format'
import { totalsOf } from '@/lib/totals'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const patient = await getPatient((await params).id)
  return { title: patient ? patient.name : 'Patient not found' }
}

/**
 * The patient file.
 *
 * Nothing here is behind a tab. Allergies, conditions and the last recorded
 * vitals are the things a doctor needs to see before they prescribe, and hiding
 * any of them behind a click is exactly the kind of small convenience that causes
 * a real mistake. The page is long on purpose.
 */
export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await getPatient(id)
  if (!patient) notFound()

  const [appointments, prescriptions, invoices] = await Promise.all([
    listAppointments({ patientId: id }),
    prescriptionsForPatient(id),
    invoicesForPatient(id),
  ])

  const upcoming = appointments
    .filter((a) => a.status === 'scheduled' && a.start >= new Date().toISOString())
    .slice(0, 3)
  const history = [...appointments].reverse().slice(0, 8)
  const lastVitals = prescriptions.find((rx) => rx.vitals)?.vitals
  const outstanding = invoices.reduce((sum, inv) => {
    const { total } = totalsOf(inv.lines, inv.discountPct, inv.taxPct)
    return inv.status === 'paid' || inv.status === 'refunded' ? sum : sum + (total - inv.paidAmount)
  }, 0)

  return (
    <>
      <PageHeader
        eyebrow={patient.mrn}
        title={patient.name}
        description={`${age(patient.dob)} · ${patient.gender} · registered ${date(patient.registeredAt)}`}
        action={
          <>
            <Button asChild variant="outline">
              <Link href={`/appointments/new?patientId=${patient.id}`}>
                <CalendarPlus className="size-4" />
                Book visit
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/prescriptions/new?patientId=${patient.id}`}>
                <FilePlus2 className="size-4" />
                Write prescription
              </Link>
            </Button>
          </>
        }
      />

      {patient.allergies.length > 0 ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
          <p className="text-sm text-ink">
            <span className="font-medium">Allergic to {patient.allergies.join(', ')}.</span>{' '}
            <span className="text-ink-soft">Check before prescribing.</span>
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem] xl:items-start">
        <div className="flex flex-col gap-4">
          {/* --- Upcoming --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming visits</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Nothing booked.{' '}
                    <Link
                      href={`/appointments/new?patientId=${patient.id}`}
                      className="font-medium text-accent hover:text-accent-hover"
                    >
                      Book a visit
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {upcoming.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-solid/40 px-3.5 py-2.5"
                      >
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-ink">{a.doctor.name}</span>
                          <span className="text-xs text-ink-soft">{a.reason}</span>
                        </span>
                        <span className="text-right">
                          <span className="block font-mono text-xs text-ink">
                            {date(a.start)} · {time(a.start)}
                          </span>
                          <span className="block font-mono text-[0.6875rem] text-ink-faint">
                            Room {a.doctor.roomNo} · {relativeDays(a.start)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* --- Prescriptions --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Prescriptions</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {prescriptions.length} on file, newest first.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {prescriptions.length === 0 ? (
                  <EmptyState
                    className="border-0 py-8"
                    title="No prescriptions yet"
                    description="Anything written during a consultation appears here."
                  />
                ) : (
                  prescriptions.slice(0, 4).map((rx) => (
                    <article
                      key={rx.id}
                      className="rounded-xl border border-line bg-surface-solid/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/prescriptions/${rx.id}`}
                            className="font-mono text-xs font-medium text-ink hover:text-accent"
                          >
                            {rx.code}
                          </Link>
                          <p className="mt-0.5 text-sm font-medium text-ink">{rx.diagnosis}</p>
                          <p className="text-xs text-ink-soft">
                            {rx.doctor.name} · {dateTime(rx.issuedAt)}
                          </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/prescriptions/${rx.id}`}>Open</Link>
                        </Button>
                      </div>

                      <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
                        {rx.items.map((item, i) => (
                          <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                            <span className="font-medium text-ink">{item.name}</span>
                            <span className="font-mono text-xs text-ink-soft">{item.strength}</span>
                            <span className="font-mono text-xs font-medium text-accent">
                              {dosage(item.dosage)}
                            </span>
                            <span className="text-xs text-ink-faint">
                              {item.durationDays} days · {item.timing.replace('-', ' ')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* --- Visit history --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <CardTitle>Visit history</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Doctor</TH>
                      <TH>Reason</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {history.map((a) => (
                      <TR key={a.id}>
                        <TD className="whitespace-nowrap font-mono text-xs text-ink-soft">
                          {date(a.start)}
                        </TD>
                        <TD className="text-ink-soft">{a.doctor.name}</TD>
                        <TD className="text-ink-soft">{a.reason}</TD>
                        <TD>
                          <AppointmentStatusBadge status={a.status} />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </Reveal>

          {/* --- Bills --- */}
          <Reveal>
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Bills</CardTitle>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {outstanding > 0
                      ? `${money(outstanding)} outstanding.`
                      : 'Nothing outstanding.'}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                {invoices.length === 0 ? (
                  <EmptyState
                    className="mx-5 mb-4 border-0 py-8"
                    title="No bills yet"
                    description="Charges appear as soon as a visit is billed."
                  />
                ) : (
                  <Table>
                    <THead>
                      <TR>
                        <TH>Invoice</TH>
                        <TH>Date</TH>
                        <TH>Kind</TH>
                        <TH numeric>Total</TH>
                        <TH>Status</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {invoices.slice(0, 6).map((inv) => (
                        <TR key={inv.id}>
                          <TD>
                            <Link
                              href={`/billing/${inv.id}`}
                              className="font-mono text-xs font-medium hover:text-accent"
                            >
                              {inv.code}
                            </Link>
                          </TD>
                          <TD className="whitespace-nowrap font-mono text-xs text-ink-soft">
                            {date(inv.issuedAt)}
                          </TD>
                          <TD className="capitalize text-ink-soft">{inv.kind}</TD>
                          <TD numeric>
                            {money(totalsOf(inv.lines, inv.discountPct, inv.taxPct).total)}
                          </TD>
                          <TD>
                            <PaymentStatusBadge status={inv.status} />
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

        {/* --- Summary rail --- */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-20">
          <Reveal>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft font-display text-base font-semibold text-accent">
                  {initials(patient.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-ink">
                    {patient.name}
                  </p>
                  <p className="font-mono text-xs text-ink-faint">{patient.mrn}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <Detail label="Blood group" value={patient.bloodGroup} mono />
                <Detail label="Age" value={age(patient.dob)} mono />
                <Detail label="Date of birth" value={date(patient.dob)} mono />
                <Detail label="Gender" value={patient.gender} className="capitalize" />
              </dl>

              <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                <a
                  href={`tel:${patient.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 text-sm text-ink-soft hover:text-accent"
                >
                  <Phone className="size-3.5 shrink-0 text-ink-faint" />
                  <span className="font-mono text-xs">{patient.phone}</span>
                </a>
                {patient.email ? (
                  <a
                    href={`mailto:${patient.email}`}
                    className="flex items-center gap-2 truncate text-sm text-ink-soft hover:text-accent"
                  >
                    <Mail className="size-3.5 shrink-0 text-ink-faint" />
                    <span className="truncate text-xs">{patient.email}</span>
                  </a>
                ) : null}
                <p className="flex items-start gap-2 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
                  <span className="text-xs">{patient.address}</span>
                </p>
              </div>
            </Card>
          </Reveal>

          <Reveal>
            <Card className="p-5">
              <p className="eyebrow mb-3 text-ink-faint">Clinical flags</p>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 text-xs text-ink-soft">Allergies</p>
                  {patient.allergies.length === 0 ? (
                    <p className="text-sm text-ink-faint">None recorded</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map((a) => (
                        <Badge key={a} tone="crit">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-ink-soft">Ongoing conditions</p>
                  {patient.conditions.length === 0 ? (
                    <p className="text-sm text-ink-faint">None recorded</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.conditions.map((c) => (
                        <Badge key={c} tone="warn">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Reveal>

          {lastVitals ? (
            <Reveal>
              <Card className="p-5">
                <p className="eyebrow mb-3 text-ink-faint">Last recorded vitals</p>
                <dl className="grid grid-cols-2 gap-3">
                  {lastVitals.bp ? <Detail label="Blood pressure" value={lastVitals.bp} mono /> : null}
                  {lastVitals.pulse ? (
                    <Detail label="Pulse" value={`${lastVitals.pulse} bpm`} mono />
                  ) : null}
                  {lastVitals.tempF ? (
                    <Detail label="Temperature" value={`${lastVitals.tempF} °F`} mono />
                  ) : null}
                  {lastVitals.weightKg ? (
                    <Detail label="Weight" value={`${lastVitals.weightKg} kg`} mono />
                  ) : null}
                  {lastVitals.spo2 ? (
                    <Detail label="SpO₂" value={`${lastVitals.spo2}%`} mono />
                  ) : null}
                </dl>
              </Card>
            </Reveal>
          ) : null}
        </div>
      </div>
    </>
  )
}

function Detail({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-ink-faint">{label}</dt>
      <dd
        className={[
          'text-sm text-ink',
          mono ? 'font-mono text-xs font-medium' : '',
          className ?? '',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  )
}
