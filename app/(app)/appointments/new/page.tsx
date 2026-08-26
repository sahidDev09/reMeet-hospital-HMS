import type { Metadata } from 'next'
import { BookingForm } from '@/components/app/booking-form'
import { PageHeader } from '@/components/app/page-header'
import { requireRole } from '@/lib/auth/roles'
import { listDoctors } from '@/lib/data/doctors'
import { getPatient } from '@/lib/data/patients'

export const metadata: Metadata = { title: 'Book visit' }

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; doctorId?: string; date?: string; slot?: string }>
}) {
  await requireRole('admin', 'staff')

  const params = await searchParams
  const [doctors, patient] = await Promise.all([
    listDoctors(),
    params.patientId ? getPatient(params.patientId) : Promise.resolve(null),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Care"
        title="Book a visit"
        description="Slots come straight off the doctor's roster, minus what's already taken."
      />
      <BookingForm
        doctors={doctors}
        initialPatient={patient}
        initialDoctorId={params.doctorId}
        initialDate={params.date ?? new Date().toISOString().slice(0, 10)}
        initialSlot={params.slot}
      />
    </>
  )
}
