import { totalsOf } from '@/lib/totals'
import { appointments, departments, doctors, invoices, medicines, patients, sales } from './fixtures'
import { clone, delay } from './store'
import type {
  DashboardStats,
  DepartmentCode,
  DoctorPerformance,
  MedicineSales,
  SeriesPoint,
} from './types'

/* --- Date helpers --------------------------------------------------------- */

function dayKey(offset: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shortDay(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toLocaleDateString('en-GB', { weekday: 'short' })
}

/** Revenue booked on a single day, from consultations and the pharmacy counter. */
function revenueOn(key: string) {
  const clinical = invoices
    .filter((i) => i.issuedAt.slice(0, 10) === key)
    .reduce((sum, i) => sum + i.paidAmount, 0)
  const pharmacy = sales
    .filter((s) => s.soldAt.slice(0, 10) === key)
    .reduce((sum, s) => sum + s.total, 0)
  return clinical + pharmacy
}

function changePct(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

/* --- Dashboard ------------------------------------------------------------ */

/**
 * The four figures on the admin dashboard, each with the 7-day trend the pulse
 * sparkline draws. Change percentages compare against the equivalent prior
 * window rather than an arbitrary baseline, so "+12%" means something.
 */
export async function dashboardStats(): Promise<DashboardStats> {
  await delay(90)

  const last7 = Array.from({ length: 7 }, (_, i) => dayKey(i - 6))
  const prev7 = Array.from({ length: 7 }, (_, i) => dayKey(i - 13))

  const revenueTrend = last7.map(revenueOn)
  const prevRevenue = prev7.reduce((s, k) => s + revenueOn(k), 0)

  const appointmentsOn = (key: string) =>
    appointments.filter((a) => a.start.slice(0, 10) === key && a.status !== 'cancelled').length
  const appointmentsTrend = last7.map(appointmentsOn)
  const prevAppointments = prev7.reduce((s, k) => s + appointmentsOn(k), 0)

  // Patient total is cumulative, so the trend is the running registration count.
  const patientsTrend = last7.map(
    (key) => patients.filter((p) => p.registeredAt.slice(0, 10) <= key).length,
  )
  const newLast7 = patients.filter((p) => p.registeredAt.slice(0, 10) >= last7[0]!).length
  const newPrev7 = patients.filter(
    (p) => p.registeredAt.slice(0, 10) >= prev7[0]! && p.registeredAt.slice(0, 10) < last7[0]!,
  ).length

  const onDutyOn = (key: string) =>
    new Set(
      appointments
        .filter((a) => a.start.slice(0, 10) === key && a.status !== 'cancelled')
        .map((a) => a.doctorId),
    ).size

  return {
    patientsTotal: patients.length,
    patientsChangePct: changePct(newLast7, newPrev7),
    patientsTrend,
    revenueToday: revenueTrend[6] ?? 0,
    revenueChangePct: changePct(
      revenueTrend.reduce((s, v) => s + v, 0),
      prevRevenue,
    ),
    revenueTrend,
    appointmentsToday: appointmentsTrend[6] ?? 0,
    appointmentsChangePct: changePct(
      appointmentsTrend.reduce((s, v) => s + v, 0),
      prevAppointments,
    ),
    appointmentsTrend,
    doctorsOnDuty: onDutyOn(dayKey(0)),
    doctorsTotal: doctors.length,
    doctorsTrend: last7.map(onDutyOn),
  }
}

/* --- Series --------------------------------------------------------------- */

export async function revenueSeries(days = 30): Promise<SeriesPoint[]> {
  await delay(80)
  return Array.from({ length: days }, (_, i) => {
    const offset = i - (days - 1)
    const key = dayKey(offset)
    return { label: key.slice(5), value: revenueOn(key) }
  })
}

/** Consultations vs pharmacy, split out — they behave differently week to week. */
export async function revenueByStream(
  days = 14,
): Promise<Array<{ label: string; clinical: number; pharmacy: number }>> {
  await delay(80)
  return Array.from({ length: days }, (_, i) => {
    const key = dayKey(i - (days - 1))
    return {
      label: key.slice(5),
      clinical: invoices
        .filter((inv) => inv.issuedAt.slice(0, 10) === key)
        .reduce((s, inv) => s + inv.paidAmount, 0),
      pharmacy: sales
        .filter((s) => s.soldAt.slice(0, 10) === key)
        .reduce((sum, s) => sum + s.total, 0),
    }
  })
}

export async function patientFlowSeries(days = 14): Promise<SeriesPoint[]> {
  await delay(70)
  return Array.from({ length: days }, (_, i) => {
    const offset = i - (days - 1)
    const key = dayKey(offset)
    return {
      label: shortDay(offset),
      value: appointments.filter((a) => a.start.slice(0, 10) === key && a.status !== 'cancelled')
        .length,
    }
  })
}

/** Visit share by department, largest first. */
export async function departmentSplit(): Promise<Array<SeriesPoint & { code: DepartmentCode }>> {
  await delay(60)
  return departments
    .map((d) => ({
      code: d.code,
      label: d.name,
      value: appointments.filter((a) => a.department === d.code && a.status !== 'cancelled').length,
    }))
    .sort((a, b) => b.value - a.value)
}

export async function appointmentStatusSplit(): Promise<SeriesPoint[]> {
  await delay(50)
  const labels: Record<string, string> = {
    completed: 'Completed',
    scheduled: 'Scheduled',
    'checked-in': 'Checked in',
    'in-consult': 'In consult',
    cancelled: 'Cancelled',
    'no-show': 'No show',
  }
  const counts = new Map<string, number>()
  for (const a of appointments) counts.set(a.status, (counts.get(a.status) ?? 0) + 1)
  return Object.entries(labels)
    .map(([status, label]) => ({ label, value: counts.get(status) ?? 0 }))
    .filter((p) => p.value > 0)
}

/* --- Leaderboards --------------------------------------------------------- */

export async function topMedicines(limit = 8): Promise<MedicineSales[]> {
  await delay(80)
  const tally = new Map<string, MedicineSales>()

  for (const sale of sales) {
    for (const line of sale.lines) {
      const row = tally.get(line.medicineId) ?? {
        medicineId: line.medicineId,
        name: line.name,
        units: 0,
        revenue: 0,
      }
      row.units += line.qty
      row.revenue += line.qty * line.unitPrice
      tally.set(line.medicineId, row)
    }
  }

  return clone(
    [...tally.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit),
  )
}

export async function doctorPerformance(): Promise<DoctorPerformance[]> {
  await delay(90)
  return clone(
    doctors
      .map((d) => {
        const consults = appointments.filter(
          (a) => a.doctorId === d.id && a.status === 'completed',
        ).length
        const revenue = invoices
          .filter((i) => i.doctorId === d.id)
          .reduce((sum, i) => sum + totalsOf(i.lines, i.discountPct, i.taxPct).total, 0)
        return {
          doctorId: d.id,
          name: d.name,
          department: d.department,
          consults,
          revenue,
          rating: d.rating,
        }
      })
      .sort((a, b) => b.revenue - a.revenue),
  )
}

/** Stock value held per department-agnostic form, for the pharmacy panel. */
export async function inventoryByForm(): Promise<SeriesPoint[]> {
  await delay(50)
  const tally = new Map<string, number>()
  for (const m of medicines) {
    tally.set(m.form, (tally.get(m.form) ?? 0) + m.stock * m.unitPrice)
  }
  return [...tally.entries()]
    .map(([label, value]) => ({ label: label[0]!.toUpperCase() + label.slice(1), value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}
