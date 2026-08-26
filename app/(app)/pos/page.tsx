import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { type CartLine, PosTerminal } from '@/components/app/pos-terminal'
import { requireRole } from '@/lib/auth/roles'
import { getPatient } from '@/lib/data/patients'
import { getMedicine, listSales } from '@/lib/data/pharmacy'
import { getPrescription } from '@/lib/data/prescriptions'
import type { PrescriptionItem } from '@/lib/data/types'
import { isSellable } from '@/lib/stock'

export const metadata: Metadata = { title: 'Counter' }

/**
 * Turns a prescribed line into a quantity to hand over.
 *
 * For tablets and capsules that's doses per day × days, which is exactly how the
 * pharmacist counts out a strip. Anything else — syrup, drops, an inhaler — is one
 * unit unless the pharmacist says otherwise, because "3 bottles of 1-0-1 for seven
 * days" isn't a thing. Unsellable lines are dropped rather than added as zero:
 * a row that can't be sold is a conversation, not a cart item.
 */
async function dispenseLine(item: PrescriptionItem): Promise<CartLine | null> {
  if (!item.medicineId) return null
  const onShelf = await getMedicine(item.medicineId)
  if (!onShelf || !isSellable(onShelf)) return null

  const perDay = item.dosage.morning + item.dosage.noon + item.dosage.night
  const counted =
    onShelf.form === 'tablet' || onShelf.form === 'capsule'
      ? Math.max(1, Math.ceil(perDay * item.durationDays))
      : 1

  return {
    medicineId: onShelf.id,
    name: onShelf.name,
    strength: onShelf.strength,
    form: onShelf.form,
    qty: Math.min(counted, onShelf.stock),
    unitPrice: onShelf.unitPrice,
    stock: onShelf.stock,
  }
}

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ prescriptionId?: string; patientId?: string }>
}) {
  await requireRole('admin', 'staff')
  const params = await searchParams

  const [rx, recent] = await Promise.all([
    params.prescriptionId
      ? getPrescription(params.prescriptionId)
      : Promise.resolve(null),
    listSales(5),
  ])

  const patient =
    rx?.patient ?? (params.patientId ? await getPatient(params.patientId) : null)

  const initialLines = rx
    ? ((await Promise.all(rx.items.map(dispenseLine))).filter(Boolean) as CartLine[])
    : []

  return (
    <>
      <PageHeader
        eyebrow="Counter"
        title="Point of sale"
        description={
          rx
            ? `Dispensing ${rx.code} for ${rx.patient.name}. Quantities are counted from the dosage — check them.`
            : 'Search, add, take payment. The shelf updates as you sell.'
        }
      />
      <PosTerminal
        initialLines={initialLines}
        initialPatient={patient}
        prescriptionId={rx?.id}
        recent={recent}
      />
    </>
  )
}
