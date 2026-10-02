import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/roles'
import { PatientPortalClient } from './patient-portal-client'

export const metadata: Metadata = { title: 'My Medical File' }

export default async function PatientPortalPage() {
  await requireRole('patient', 'admin')
  return <PatientPortalClient />
}
