import { appointments, doctors, patients } from './fixtures'
import { clone, delay } from './store'
import type {
  Appointment,
  AppointmentInput,
  AppointmentQuery,
  AppointmentStatus,
  AppointmentView,
} from './types'

/** Attach the patient and doctor an appointment row always needs to render. */
function hydrate(a: Appointment): AppointmentView | null {
  const patient = patients.find((p) => p.id === a.patientId)
  const doctor = doctors.find((d) => d.id === a.doctorId)
  if (!patient || !doctor) return null
  return { ...a, patient, doctor }
}

function apply(q: AppointmentQuery) {
  return appointments
    .filter((a) => (q.doctorId ? a.doctorId === q.doctorId : true))
    .filter((a) => (q.patientId ? a.patientId === q.patientId : true))
    .filter((a) => (q.department ? a.department === q.department : true))
    .filter((a) => (q.status ? a.status === q.status : true))
    .filter((a) => (q.on ? a.start.slice(0, 10) === q.on : true))
    .filter((a) => (q.from ? a.start.slice(0, 10) >= q.from : true))
    .filter((a) => (q.to ? a.start.slice(0, 10) <= q.to : true))
}

export async function listAppointments(q: AppointmentQuery = {}): Promise<AppointmentView[]> {
  await delay()
  return clone(
    apply(q)
      .map(hydrate)
      .filter((a): a is AppointmentView => a !== null)
      .sort((a, b) => a.start.localeCompare(b.start)),
  )
}

export async function getAppointment(id: string): Promise<AppointmentView | null> {
  await delay(50)
  const found = appointments.find((a) => a.id === id)
  return found ? clone(hydrate(found)) : null
}

/** Today's schedule for one doctor — the doctor portal's main list. */
export async function todayForDoctor(doctorId: string): Promise<AppointmentView[]> {
  return listAppointments({ doctorId, on: new Date().toISOString().slice(0, 10) })
}

/**
 * The live queue: everyone checked in or in consult right now, ordered by the
 * number they were given at the desk.
 */
export async function liveQueue(): Promise<AppointmentView[]> {
  await delay(60)
  const todayKey = new Date().toISOString().slice(0, 10)
  return clone(
    appointments
      .filter(
        (a) =>
          a.start.slice(0, 10) === todayKey &&
          (a.status === 'checked-in' || a.status === 'in-consult'),
      )
      .map(hydrate)
      .filter((a): a is AppointmentView => a !== null)
      .sort((a, b) => (a.queueNo ?? 99) - (b.queueNo ?? 99)),
  )
}

/**
 * Appointment counts keyed by ISO date, for the month grid. Cancelled visits are
 * excluded — an empty-looking day should mean "nothing happening", not
 * "something was booked and dropped".
 */
export async function monthCounts(year: number, month: number): Promise<Record<string, number>> {
  await delay(60)
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const counts: Record<string, number> = {}
  for (const a of appointments) {
    if (!a.start.startsWith(prefix) || a.status === 'cancelled') continue
    const key = a.start.slice(0, 10)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export async function createAppointment(input: AppointmentInput): Promise<AppointmentView> {
  await delay(160)
  const record: Appointment = {
    ...input,
    id: `apt_${String(appointments.length + 1).padStart(4, '0')}`,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  }
  appointments.push(record)
  appointments.sort((a, b) => a.start.localeCompare(b.start))
  return clone(hydrate(record)!)
}

export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentView | null> {
  await delay(100)
  const index = appointments.findIndex((a) => a.id === id)
  if (index === -1) return null

  const current = appointments[index]!
  // Checking in is what assigns a queue number, exactly as it does at the desk.
  const queueNo =
    status === 'checked-in' && current.queueNo === undefined
      ? appointments.filter((a) => a.queueNo !== undefined).length + 1
      : current.queueNo

  appointments[index] = { ...current, status, queueNo }
  return clone(hydrate(appointments[index]!))
}
