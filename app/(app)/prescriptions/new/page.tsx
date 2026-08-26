import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { PrescriptionBuilder } from '@/components/app/prescription-builder'
import { DEMO_DOCTOR_ID, getRole } from '@/lib/auth/roles'
import { listDoctors } from '@/lib/data/doctors'
import { getPatient } from '@/lib/data/patients'

export const metadata: Metadata = { title: 'Write prescription' }

export default async function NewPrescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; appointmentId?: string }>
}) {
  const params = await searchParams
  const role = await getRole()

  const [doctors, patient] = await Promise.all([
    listDoctors(),
    params.patientId ? getPatient(params.patientId) : Promise.resolve(null),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Care"
        title="Write prescription"
        description="Dosage in morning-noon-night. Allergies on the record are checked as you add medicines."
      />
      <PrescriptionBuilder
        doctors={doctors}
        defaultDoctorId={role === 'doctor' ? DEMO_DOCTOR_ID : undefined}
        lockDoctor={role === 'doctor'}
        initialPatient={patient}
        appointmentId={params.appointmentId}
      />
    </>
  )
}
