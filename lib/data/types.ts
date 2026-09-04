/**
 * Domain types for reMeet.
 *
 * These are the contract between the UI and whatever serves it. Every field is
 * plain and serialisable, so the same shapes survive the move from mock
 * fixtures to a real API without any component changing.
 */

export type Role = 'admin' | 'doctor' | 'staff' | 'patient'

/**
 * Real department codes. These aren't cosmetic — they're the hospital's own
 * shorthand (wristbands, charts, room signage) and they double as the filter
 * key throughout the app.
 */
export type DepartmentCode = 'GENM' | 'PEDS' | 'OBGY' | 'CARD' | 'RADI' | 'ORTH'

export type Department = {
  code: DepartmentCode
  name: string
  blurb: string
  services: string[]
  fromPrice: number
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type Gender = 'male' | 'female' | 'other'
export type Weekday = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'

export type Patient = {
  id: string
  /** Medical record number — what staff actually search by. */
  mrn: string
  name: string
  dob: string
  gender: Gender
  phone: string
  email?: string
  address: string
  bloodGroup: BloodGroup
  allergies: string[]
  conditions: string[]
  registeredAt: string
  lastVisitAt?: string
}

export type Doctor = {
  id: string
  name: string
  department: DepartmentCode
  specialty: string
  qualifications: string
  /** Medical council registration number, printed on every prescription. */
  regNo: string
  phone: string
  email: string
  roomNo: string
  consultationFee: number
  experienceYears: number
  rating: number
  patientsSeen: number
  availableDays: Weekday[]
  slots: string[]
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'in-consult'
  | 'completed'
  | 'cancelled'
  | 'no-show'

export type Appointment = {
  id: string
  patientId: string
  doctorId: string
  department: DepartmentCode
  /** ISO datetime. */
  start: string
  durationMin: number
  status: AppointmentStatus
  reason: string
  /** Position in today's queue, assigned at check-in. */
  queueNo?: number
  createdAt: string
}

export type Vitals = {
  bp?: string
  pulse?: number
  tempF?: number
  weightKg?: number
  spo2?: number
}

export type MedicineForm =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'injection'
  | 'ointment'
  | 'drops'
  | 'inhaler'

export type MealTiming = 'before-meal' | 'after-meal' | 'anytime'

/** Morning-noon-night counts, the notation clinicians already read as `1-0-1`. */
export type Dosage = { morning: number; noon: number; night: number }

export type PrescriptionItem = {
  medicineId?: string
  name: string
  generic?: string
  strength: string
  form: MedicineForm
  dosage: Dosage
  timing: MealTiming
  durationDays: number
  instructions?: string
}

export type Prescription = {
  id: string
  /** Human-facing code, printed on the sheet. */
  code: string
  patientId: string
  doctorId: string
  appointmentId?: string
  issuedAt: string
  complaints: string
  diagnosis: string
  vitals?: Vitals
  items: PrescriptionItem[]
  advice: string[]
  labTests: string[]
  followUpAt?: string
}

export type Medicine = {
  id: string
  sku: string
  name: string
  generic: string
  strength: string
  form: MedicineForm
  manufacturer: string
  unitPrice: number
  stock: number
  reorderLevel: number
  expiry: string
  batchNo: string
  rack: string
  prescriptionOnly: boolean
}

/** Derived shelf state — drives the vital-* colour banding in the inventory. */
export type StockState = 'ok' | 'low' | 'out' | 'expiring' | 'expired'

export type InvoiceKind = 'consultation' | 'lab' | 'pharmacy' | 'procedure' | 'mixed'
export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'mobile'

export type InvoiceLine = {
  label: string
  detail?: string
  qty: number
  unitPrice: number
}

export type Invoice = {
  id: string
  code: string
  patientId: string
  doctorId?: string
  kind: InvoiceKind
  lines: InvoiceLine[]
  discountPct: number
  taxPct: number
  status: PaymentStatus
  method?: PaymentMethod
  issuedAt: string
  paidAt?: string
  paidAmount: number
}

export type SaleLine = {
  medicineId: string
  name: string
  strength: string
  qty: number
  unitPrice: number
}

export type Sale = {
  id: string
  code: string
  lines: SaleLine[]
  discountPct: number
  method: PaymentMethod
  total: number
  soldAt: string
  patientId?: string
  prescriptionId?: string
  cashier: string
}

/* --- Joined views --------------------------------------------------------

   A list of appointments is useless without the patient's name and the
   doctor's room. Rather than have every page fetch three times and stitch, the
   data layer returns the join — which is also what a real endpoint would send.
-------------------------------------------------------------------------- */

export type AppointmentView = Appointment & { patient: Patient; doctor: Doctor }
export type PrescriptionView = Prescription & { patient: Patient; doctor: Doctor }
export type InvoiceView = Invoice & { patient: Patient; doctor?: Doctor }

/* --- Analytics ----------------------------------------------------------- */

export type SeriesPoint = { label: string; value: number }

export type DashboardStats = {
  patientsTotal: number
  patientsChangePct: number
  patientsTrend: number[]
  revenueToday: number
  revenueChangePct: number
  revenueTrend: number[]
  appointmentsToday: number
  appointmentsChangePct: number
  appointmentsTrend: number[]
  doctorsOnDuty: number
  doctorsTotal: number
  doctorsTrend: number[]
}

export type DoctorPerformance = {
  doctorId: string
  name: string
  department: DepartmentCode
  consults: number
  revenue: number
  rating: number
}

export type MedicineSales = {
  medicineId: string
  name: string
  units: number
  revenue: number
}

/* --- Query / pagination --------------------------------------------------- */

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type PatientQuery = {
  search?: string
  gender?: Gender
  bloodGroup?: BloodGroup
  page?: number
  pageSize?: number
}

export type AppointmentQuery = {
  doctorId?: string
  patientId?: string
  department?: DepartmentCode
  status?: AppointmentStatus
  /** ISO date (yyyy-mm-dd) — matches appointments starting on that day. */
  on?: string
  from?: string
  to?: string
}

export type MedicineQuery = {
  search?: string
  form?: MedicineForm
  state?: StockState
  page?: number
  pageSize?: number
}

export type InvoiceQuery = {
  search?: string
  status?: PaymentStatus
  kind?: InvoiceKind
  page?: number
  pageSize?: number
}

/* --- Input shapes for writes --------------------------------------------- */

export type PatientInput = Omit<Patient, 'id' | 'mrn' | 'registeredAt' | 'lastVisitAt'>
export type AppointmentInput = Omit<Appointment, 'id' | 'createdAt' | 'queueNo' | 'status'>
export type PrescriptionInput = Omit<Prescription, 'id' | 'code' | 'issuedAt'>
