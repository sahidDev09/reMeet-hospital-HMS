'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertTriangle, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import {
  bookAppointmentAction,
  freeSlotsAction,
  type BookingState,
} from '@/app/actions/appointments'
import { PatientPicker } from '@/components/app/patient-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, NativeSelect } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import type { Doctor, Patient, Weekday } from '@/lib/data/types'
import { money } from '@/lib/format'

const WEEK: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Booking a visit.
 *
 * The order of the fields is the order of the conversation at the desk: who,
 * which doctor, what day, what time. Times come last and are shown as the actual
 * open slots for that doctor on that date — never a free-text field, because
 * "10:47" is not a thing the chamber can honour.
 *
 * Doctors not rostered on the chosen day are filtered out from the doctor list
 * rather than greyed out. Their roster is already on the record, so there's no
 * round trip to work out who's in.
 */
export function BookingForm({
  doctors,
  initialPatient,
  initialDoctorId,
  initialDate,
  initialSlot,
}: {
  doctors: Doctor[]
  initialPatient?: Patient | null
  initialDoctorId?: string
  initialDate: string
  initialSlot?: string
}) {
  const [state, action] = useActionState<BookingState, FormData>(bookAppointmentAction, {})

  const [date, setDate] = useState(initialDate)
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? '')
  const [slot, setSlot] = useState(initialSlot ?? '')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, startLoad] = useTransition()

  const weekday = WEEK[new Date(`${date}T00:00:00`).getDay()]
  const rostered = doctors.filter((d) => (weekday ? d.availableDays.includes(weekday) : true))
  const doctor = doctors.find((d) => d.id === doctorId)

  // A doctor chosen on Tuesday who doesn't work Wednesdays can't stay selected.
  useEffect(() => {
    if (!doctorId || !weekday) return
    const stillIn = doctors.some((d) => d.id === doctorId && d.availableDays.includes(weekday))
    if (!stillIn) {
      setDoctorId('')
      setSlot('')
    }
  }, [doctorId, weekday, doctors])

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([])
      return
    }
    let live = true
    startLoad(async () => {
      const open = await freeSlotsAction(doctorId, date)
      if (!live) return
      setSlots(open)
      setSlot((current) => (open.includes(current) ? current : ''))
    })
    return () => {
      live = false
    }
  }, [doctorId, date])

  const err = (field: string) => state.fieldErrors?.[field]

  return (
    <form action={action} className="grid gap-4 xl:grid-cols-[1fr_18rem] xl:items-start">
      <div className="flex flex-col gap-4">
        {state.error ? (
          <div className="flex items-start gap-3 rounded-xl border border-vital-crit/30 bg-vital-crit/[0.06] px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-vital-crit" strokeWidth={2.5} />
            <p className="text-sm text-ink">{state.error}</p>
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Who is coming in</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientPicker initial={initialPatient} error={err('patientId')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>When and with whom</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="date" error={err('date')}>
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>

            <Field
              label="Doctor"
              htmlFor="doctorId"
              error={err('doctorId')}
              hint={
                weekday
                  ? `${rostered.length} of ${doctors.length} in on ${weekday}.`
                  : undefined
              }
            >
              <NativeSelect
                id="doctorId"
                name="doctorId"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a doctor
                </option>
                {rostered.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty} ({d.department})
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label="Reason for the visit"
              htmlFor="reason"
              error={err('reason')}
              className="sm:col-span-2"
            >
              <Input
                id="reason"
                name="reason"
                placeholder="Follow-up, chest pain, routine check…"
                required
              />
            </Field>

            <Field label="Length" htmlFor="durationMin">
              <NativeSelect id="durationMin" name="durationMin" defaultValue="15">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Time</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                {!doctorId
                  ? 'Choose a doctor to see open slots.'
                  : loadingSlots
                    ? 'Checking the chamber…'
                    : slots.length === 0
                      ? 'No slots left that day.'
                      : `${slots.length} open.`}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <input type="hidden" name="slot" value={slot} />
            {slots.length === 0 ? (
              <p className="text-sm text-ink-faint">
                {doctorId && !loadingSlots
                  ? 'Try another date, or another doctor in the same department.'
                  : 'Nothing to pick yet.'}
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label="Open slots"
                className="flex flex-wrap gap-2"
              >
                {slots.map((s) => {
                  const active = s === slot
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSlot(s)}
                      className={
                        active
                          ? 'rounded-lg bg-accent px-3.5 py-2 font-mono text-xs font-semibold text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40'
                          : 'rounded-lg border border-line bg-surface-solid/50 px-3.5 py-2 font-mono text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25'
                      }
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            )}
            {err('slot') ? (
              <p className="mt-2 text-xs font-medium text-vital-crit">{err('slot')}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="p-5 xl:sticky xl:top-20">
        <p className="eyebrow mb-3 text-ink-faint">This booking</p>
        <dl className="flex flex-col gap-2.5">
          <Row label="Doctor" value={doctor ? doctor.name : 'Not chosen'} />
          <Row label="Department" value={doctor ? doctor.department : '—'} />
          <Row label="Room" value={doctor ? doctor.roomNo : '—'} />
          <Row
            label="Date"
            value={new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          />
          <Row label="Time" value={slot || 'Not chosen'} />
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-ink-soft">Consultation fee</span>
          <span className="font-display text-lg font-semibold text-ink tabular">
            {doctor ? money(doctor.consultationFee) : '—'}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">Collected at the counter on arrival.</p>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
          <SubmitButton disabled={!slot} />
          <Button asChild variant="ghost">
            <Link href="/appointments">Cancel</Link>
          </Button>
        </div>
      </Card>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="truncate text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled}>
      <CalendarPlus className="size-4" />
      {pending ? 'Booking…' : 'Book visit'}
    </Button>
  )
}
