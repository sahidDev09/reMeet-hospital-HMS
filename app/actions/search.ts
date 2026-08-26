'use server'

import { searchPatients } from '@/lib/data/patients'
import { listDoctors } from '@/lib/data/doctors'
import { searchMedicines } from '@/lib/data/pharmacy'

export type SearchHit = {
  id: string
  href: string
  title: string
  detail: string
  group: 'Patients' | 'Doctors' | 'Medicines'
}

/**
 * One search across the three things staff look up mid-conversation: a person on
 * the phone, a doctor's room number, a drug's shelf state. Runs on the server so
 * no fixture data reaches the browser bundle — and so it becomes a single API
 * call later instead of three.
 */
export async function globalSearch(term: string): Promise<SearchHit[]> {
  const q = term.trim()
  if (q.length < 2) return []

  const [patients, doctors, medicines] = await Promise.all([
    searchPatients(q, 5),
    listDoctors({ search: q }),
    searchMedicines(q, 5),
  ])

  return [
    ...patients.map((p) => ({
      id: p.id,
      href: `/patients/${p.id}`,
      title: p.name,
      detail: `${p.mrn} · ${p.phone}`,
      group: 'Patients' as const,
    })),
    ...doctors.slice(0, 4).map((d) => ({
      id: d.id,
      href: `/doctors/${d.id}`,
      title: d.name,
      detail: `${d.specialty} · Room ${d.roomNo}`,
      group: 'Doctors' as const,
    })),
    ...medicines.map((m) => ({
      id: m.id,
      href: `/pharmacy?q=${encodeURIComponent(m.name)}`,
      title: `${m.name} ${m.strength}`,
      detail: `${m.generic} · ${m.stock} in stock · Rack ${m.rack}`,
      group: 'Medicines' as const,
    })),
  ]
}
