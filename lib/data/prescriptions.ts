import { doctors, patients, prescriptions } from './fixtures'
import { clone, delay, matches, paginate } from './store'
import type {
  Paginated,
  Prescription,
  PrescriptionInput,
  PrescriptionView,
} from './types'

function hydrate(rx: Prescription): PrescriptionView | null {
  const patient = patients.find((p) => p.id === rx.patientId)
  const doctor = doctors.find((d) => d.id === rx.doctorId)
  if (!patient || !doctor) return null
  return { ...rx, patient, doctor }
}

export async function listPrescriptions(
  q: {
    search?: string
    patientId?: string
    doctorId?: string
    page?: number
    pageSize?: number
  } = {},
): Promise<Paginated<PrescriptionView>> {
  await delay()
  const rows = prescriptions
    .filter((rx) => (q.patientId ? rx.patientId === q.patientId : true))
    .filter((rx) => (q.doctorId ? rx.doctorId === q.doctorId : true))
    .map(hydrate)
    .filter((rx): rx is PrescriptionView => rx !== null)
    .filter((rx) => matches(q.search, rx.code, rx.patient.name, rx.patient.mrn, rx.diagnosis))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))

  return clone(paginate(rows, q.page, q.pageSize))
}

export async function getPrescription(id: string): Promise<PrescriptionView | null> {
  await delay(60)
  const found = prescriptions.find((rx) => rx.id === id)
  return found ? clone(hydrate(found)) : null
}

/** Full prescription history for one patient, newest first. */
export async function prescriptionsForPatient(patientId: string): Promise<PrescriptionView[]> {
  await delay(70)
  return clone(
    prescriptions
      .filter((rx) => rx.patientId === patientId)
      .map(hydrate)
      .filter((rx): rx is PrescriptionView => rx !== null)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
  )
}

export async function createPrescription(input: PrescriptionInput): Promise<PrescriptionView> {
  await delay(180)
  const record: Prescription = {
    ...input,
    id: `rx_${String(prescriptions.length + 1).padStart(4, '0')}`,
    code: `RX-${new Date().getFullYear()}-${String(3100 + prescriptions.length * 3).padStart(5, '0')}`,
    issuedAt: new Date().toISOString(),
  }
  prescriptions.unshift(record)
  return clone(hydrate(record)!)
}
