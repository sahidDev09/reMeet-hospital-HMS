import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { PatientForm } from '@/components/app/patient-form'

import { requireRole } from '@/lib/auth/roles'

export const metadata: Metadata = { title: 'Add patient' }

export default async function NewPatientPage() {
  await requireRole('admin', 'staff', 'doctor')
  return (
    <>
      <PageHeader
        eyebrow="Records"
        title="Add patient"
        description="Six required fields. The record is live the moment it saves — no approval step."
      />
      <PatientForm />
    </>
  )
}
