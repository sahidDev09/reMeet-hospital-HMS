import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { PatientForm } from '@/components/app/patient-form'

export const metadata: Metadata = { title: 'Add patient' }

export default function NewPatientPage() {
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
