import { patients } from './fixtures'
import { clone, delay, matches, nextId, paginate } from './store'
import type { Paginated, Patient, PatientInput, PatientQuery } from './types'

/**
 * Patient records.
 *
 * Replace each body with a fetch/query and the rest of the app is unaffected.
 */

export async function listPatients(q: PatientQuery = {}): Promise<Paginated<Patient>> {
  await delay()
  const filtered = patients
    .filter((p) => matches(q.search, p.name, p.mrn, p.phone, p.email))
    .filter((p) => (q.gender ? p.gender === q.gender : true))
    .filter((p) => (q.bloodGroup ? p.bloodGroup === q.bloodGroup : true))
    .sort((a, b) => (b.lastVisitAt ?? b.registeredAt).localeCompare(a.lastVisitAt ?? a.registeredAt))

  return clone(paginate(filtered, q.page, q.pageSize))
}

export async function getPatient(id: string): Promise<Patient | null> {
  await delay(60)
  return clone(patients.find((p) => p.id === id) ?? null)
}

/** Used by the prescription builder and POS to attach a sale to a person. */
export async function searchPatients(term: string, limit = 8): Promise<Patient[]> {
  await delay(40)
  if (!term.trim()) return []
  return clone(
    patients.filter((p) => matches(term, p.name, p.mrn, p.phone)).slice(0, limit),
  )
}

export async function countPatients(): Promise<number> {
  await delay(20)
  return patients.length
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  await delay(140)
  const id = nextId('pat', patients)
  const record: Patient = {
    ...input,
    id,
    mrn: `RM-${new Date().getFullYear()}-${String(1042 + patients.length * 7).padStart(5, '0')}`,
    registeredAt: new Date().toISOString(),
  }
  patients.unshift(record)
  return clone(record)
}

export async function updatePatient(
  id: string,
  patch: Partial<PatientInput>,
): Promise<Patient | null> {
  await delay(120)
  const index = patients.findIndex((p) => p.id === id)
  if (index === -1) return null
  patients[index] = { ...patients[index]!, ...patch }
  return clone(patients[index]!)
}
