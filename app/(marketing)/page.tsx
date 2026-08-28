import { DepartmentGrid } from '@/components/Landing/department-grid'
import { DoctorRail } from '@/components/Landing/doctor-rail'
import { Hero } from '@/components/Landing/hero'
import { SiteFooter } from '@/components/Landing/site-footer'
import { StatBand } from '@/components/Landing/stat-band'
import { VisitFlow } from '@/components/Landing/visit-flow'
import { dashboardStats, revenueSeries } from '@/lib/data/analytics'
import { listDepartments, listDoctors } from '@/lib/data/doctors'
import { countPatients } from '@/lib/data/patients'
import { listMedicines } from '@/lib/data/pharmacy'
import { listPrescriptions } from '@/lib/data/prescriptions'

/**
 * The landing page reads the same data layer as the application.
 *
 * That's the point: the figures in the hero and the stat band are the clinic's
 * actual numbers, so the marketing surface cannot drift from the product. Swap
 * the data layer for a live backend and this page starts telling the truth about
 * a real hospital with no edits here.
 */
export default async function LandingPage() {
  const [stats, departments, doctors, patients, prescriptions, medicines, revenue30] =
    await Promise.all([
      dashboardStats(),
      listDepartments(),
      listDoctors(),
      countPatients(),
      listPrescriptions({ pageSize: 1 }),
      listMedicines({ pageSize: 1 }),
      revenueSeries(30),
    ])

  const doctorCounts = doctors.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.department] = (acc[doc.department] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <Hero
        revenueToday={stats.revenueToday}
        consultsToday={stats.appointmentsToday}
        departmentCount={departments.length}
      />

      <StatBand
        patients={patients}
        prescriptions={prescriptions.total}
        medicines={medicines.total}
        collectedThisMonth={revenue30.reduce((sum, p) => sum + p.value, 0)}
      />

      <DepartmentGrid departments={departments} doctorCounts={doctorCounts} />

      <VisitFlow />

      <DoctorRail doctors={doctors} />

      <SiteFooter />
    </>
  )
}
