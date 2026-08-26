'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAppointment, setAppointmentStatus } from '@/lib/data/appointments'
import { freeSlots, getDoctor } from '@/lib/data/doctors'
import { searchPatients } from '@/lib/data/patients'
import type { AppointmentStatus, Patient } from '@/lib/data/types'

export type StatusResult = {
  ok: boolean
  error?: string
  status?: AppointmentStatus
  queueNo?: number
}

/**
 * Moving a visit along: check in, start, finish, cancel.
 *
 * One action for every transition rather than four, because the desk and the
 * chamber are pressing buttons on the same record and the rules that govern
 * which transition is legal belong next to the data, not in the component.
 */
export async function setStatusAction(
  id: string,
  status: AppointmentStatus,
): Promise<StatusResult> {
  const updated = await setAppointmentStatus(id, status)
  if (!updated) return { ok: false, error: 'That appointment no longer exists.' }

  // Every surface that shows a queue position or a status pill.
  revalidatePath('/portal')
  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  revalidatePath(`/patients/${updated.patientId}`)
  revalidatePath(`/doctors/${updated.doctorId}`)

  return { ok: true, status: updated.status, queueNo: updated.queueNo }
}

/** Patient lookup for the booking combobox. Runs on the server so no record set
 *  is shipped to the browser — only the handful of matches someone typed for. */
export async function findPatientsAction(term: string): Promise<Patient[]> {
  return searchPatients(term, 6)
}

/** Slots left for a doctor on a date. Called when either one changes. */
export async function freeSlotsAction(doctorId: string, isoDate: string): Promise<string[]> {
  if (!doctorId || !isoDate) return []
  return freeSlots(doctorId, isoDate)
}

export type BookingState = {
  error?: string
  fieldErrors?: Record<string, string>
}

/**
 * Booking a visit.
 *
 * The slot is re-checked here rather than trusted from the form. Two people at
 * two desks can pick the same 10:30 within a second of each other, and the one
 * who submits second has to be told — quietly, before the double booking exists,
 * not afterwards.
 */
export async function bookAppointmentAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const get = (key: string) => (formData.get(key) as string | null)?.trim() ?? ''

  const patientId = get('patientId')
  const doctorId = get('doctorId')
  const date = get('date')
  const slot = get('slot')
  const reason = get('reason')
  const durationMin = Number(get('durationMin') || 15)

  const fieldErrors: Record<string, string> = {}
  if (!patientId) fieldErrors.patientId = 'Choose a patient'
  if (!doctorId) fieldErrors.doctorId = 'Choose a doctor'
  if (!date) fieldErrors.date = 'Pick a date'
  if (!slot) fieldErrors.slot = 'Pick a time'
  if (!reason) fieldErrors.reason = 'Say why they are coming in'

  if (Object.keys(fieldErrors).length > 0) {
    return { error: 'A few details are missing.', fieldErrors }
  }

  const doctor = await getDoctor(doctorId)
  if (!doctor) return { error: 'That doctor is no longer on the roster.' }

  const open = await freeSlots(doctorId, date)
  if (!open.includes(slot)) {
    return {
      error: `${slot} was taken while you were filling this in. Pick another time.`,
      fieldErrors: { slot: 'No longer free' },
    }
  }

  await createAppointment({
    patientId,
    doctorId,
    department: doctor.department,
    start: new Date(`${date}T${slot}:00`).toISOString(),
    durationMin,
    reason,
  })

  revalidatePath('/appointments')
  revalidatePath('/dashboard')
  revalidatePath(`/patients/${patientId}`)
  revalidatePath(`/doctors/${doctorId}`)

  redirect(`/appointments?d=${date}`)
}
