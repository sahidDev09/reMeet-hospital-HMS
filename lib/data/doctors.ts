import { appointments, departments, doctors } from './fixtures'
import { clone, delay, matches } from './store'
import type { Department, DepartmentCode, Doctor, Weekday } from './types'

const WEEKDAYS: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function listDoctors(q: { search?: string; department?: DepartmentCode } = {}): Promise<
  Doctor[]
> {
  await delay()
  return clone(
    doctors
      .filter((d) => matches(q.search, d.name, d.specialty, d.department, d.qualifications))
      .filter((d) => (q.department ? d.department === q.department : true))
      .sort((a, b) => b.rating - a.rating),
  )
}

export async function getDoctor(id: string): Promise<Doctor | null> {
  await delay(60)
  return clone(doctors.find((d) => d.id === id) ?? null)
}

export async function listDepartments(): Promise<Department[]> {
  await delay(30)
  return clone(departments)
}

export async function getDepartment(code: DepartmentCode): Promise<Department | null> {
  await delay(20)
  return clone(departments.find((d) => d.code === code) ?? null)
}

/** Doctors rostered for a given ISO date — drives the booking form's doctor list. */
export async function doctorsAvailableOn(isoDate: string): Promise<Doctor[]> {
  await delay(50)
  const day = WEEKDAYS[new Date(`${isoDate}T00:00:00`).getDay()]!
  return clone(doctors.filter((d) => d.availableDays.includes(day)))
}

/**
 * Slots the doctor works, minus the ones already taken on that date. Booking
 * needs the difference, not the full roster.
 */
export async function freeSlots(doctorId: string, isoDate: string): Promise<string[]> {
  await delay(50)
  const doctor = doctors.find((d) => d.id === doctorId)
  if (!doctor) return []

  const taken = new Set(
    appointments
      .filter(
        (a) =>
          a.doctorId === doctorId &&
          a.start.slice(0, 10) === isoDate &&
          a.status !== 'cancelled',
      )
      .map((a) => a.start.slice(11, 16)),
  )

  return doctor.slots.filter((s) => !taken.has(s))
}

/** Doctors with a consult currently in progress — the dashboard's "on duty" figure. */
export async function doctorsOnDuty(): Promise<Doctor[]> {
  await delay(30)
  const todayKey = new Date().toISOString().slice(0, 10)
  const activeIds = new Set(
    appointments
      .filter(
        (a) =>
          a.start.slice(0, 10) === todayKey &&
          (a.status === 'in-consult' || a.status === 'checked-in' || a.status === 'scheduled'),
      )
      .map((a) => a.doctorId),
  )
  return clone(doctors.filter((d) => activeIds.has(d.id)))
}
