import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { InvoiceBuilder } from '@/components/app/invoice-builder'
import { requireRole } from '@/lib/auth/roles'
import { listDoctors } from '@/lib/data/doctors'
import { getPatient } from '@/lib/data/patients'

export const metadata: Metadata = { title: 'Raise invoice' }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
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
        eyebrow="Money"
        title="Raise invoice"
        description="Charges, discount and VAT. Payment is taken once the invoice exists."
      />
      <InvoiceBuilder doctors={doctors} initialPatient={patient} />
    </>
  )
}
