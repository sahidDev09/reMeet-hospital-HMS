import { DepartmentGrid } from '@/components/marketing/department-grid'
import { DoctorRail } from '@/components/marketing/doctor-rail'
import { Hero, type HeroQueueRow } from '@/components/marketing/hero'
import { SiteFooter } from '@/components/marketing/site-footer'
import { StatBand } from '@/components/marketing/stat-band'
import { VisitFlow } from '@/components/marketing/visit-flow'
import { dashboardStats, revenueSeries } from '@/lib/data/analytics'
import { listAppointments, liveQueue } from '@/lib/data/appointments'
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
  const [stats, departments, doctors, queue, patients, prescriptions, medicines, revenue30] =
    await Promise.all([
      dashboardStats(),
      listDepartments(),
      listDoctors(),
      liveQueue(),
      countPatients(),
      listPrescriptions({ pageSize: 1 }),
      listMedicines({ pageSize: 1 }),
      revenueSeries(30),
    ])

  // The board shows who is actually waiting. On a quiet morning nobody has been
  // checked in yet, so fall back to today's booked list rather than an empty card.
  const board =
    queue.length > 0
      ? queue
      : await listAppointments({ on: new Date().toISOString().slice(0, 10) })

  const queueRows: HeroQueueRow[] = board.slice(0, 4).map((a, i) => ({
    queueNo: a.queueNo ?? i + 1,
    patient: a.patient.name,
    doctor: a.doctor.name,
    department: a.department,
    start: a.start,
    state: a.status === 'in-consult' ? 'In consult' : 'Waiting',
  }))

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
        revenueTrend={stats.revenueTrend}
        queue={queueRows}
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
