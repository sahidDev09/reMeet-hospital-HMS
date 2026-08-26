import type {
  Appointment,
  AppointmentStatus,
  Department,
  Doctor,
  Invoice,
  Medicine,
  Patient,
  Prescription,
  Sale,
} from './types'

/* ---------------------------------------------------------------------------
   Deterministic helpers

   No Math.random and no ambient Date reads inside render paths: dates are
   anchored to today-at-midnight and randomness is seeded, so the same data
   comes back for every call within a day. That keeps server output stable and
   avoids hydration drift.
--------------------------------------------------------------------------- */

function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** ISO datetime, `days` from today at the given local time. */
function at(days: number, hour = 9, minute = 0) {
  const d = today()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/** ISO calendar date (yyyy-mm-dd), `days` from today. */
function on(days: number) {
  const d = today()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** mulberry32 — small, fast, seeded. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!
const int = (r: () => number, min: number, max: number) => min + Math.floor(r() * (max - min + 1))

const YEAR = new Date().getFullYear()

/* ---------------------------------------------------------------------------
   Departments
--------------------------------------------------------------------------- */

export const departments: Department[] = [
  {
    code: 'GENM',
    name: 'Family Medicine',
    blurb:
      'First point of contact for adults and children — screening, diagnosis, and ongoing care under one doctor who knows the whole history.',
    services: ['General consultation', 'Health screening', 'Chronic care', 'Vaccination'],
    fromPrice: 600,
  },
  {
    code: 'PEDS',
    name: 'Pediatrics',
    blurb:
      'Care for newborns through adolescence, with growth tracking and immunisation schedules kept on one record.',
    services: ['Well-child visits', 'Immunisation', 'Growth monitoring', 'Newborn care'],
    fromPrice: 700,
  },
  {
    code: 'OBGY',
    name: "Women's Health",
    blurb:
      'Obstetrics and gynaecology across every stage — planning, pregnancy, delivery, and the years after.',
    services: ['Antenatal care', 'Gynaecology', 'Fertility counselling', 'Ultrasound'],
    fromPrice: 900,
  },
  {
    code: 'CARD',
    name: 'Cardiology',
    blurb:
      'Diagnosis and management of heart and vascular conditions, with ECG and echocardiography on site.',
    services: ['ECG', 'Echocardiography', 'Holter monitoring', 'Hypertension clinic'],
    fromPrice: 1200,
  },
  {
    code: 'RADI',
    name: 'Ultrasound & Lab',
    blurb:
      'Imaging and pathology in the same visit, with results released to your record the day they are read.',
    services: ['Ultrasound', 'X-ray', 'Blood panels', 'Pathology'],
    fromPrice: 500,
  },
  {
    code: 'ORTH',
    name: 'Orthopaedics',
    blurb:
      'Bones, joints, and sports injuries — from fracture management through rehabilitation planning.',
    services: ['Fracture care', 'Joint injection', 'Sports injury', 'Physiotherapy referral'],
    fromPrice: 1000,
  },
]

/* ---------------------------------------------------------------------------
   Doctors
--------------------------------------------------------------------------- */

export const doctors: Doctor[] = [
  {
    id: 'doc_01',
    name: 'Dr. Farhana Rahman',
    department: 'CARD',
    specialty: 'Interventional Cardiology',
    qualifications: 'MBBS, FCPS (Medicine), MD (Cardiology)',
    regNo: 'BMDC-A-48213',
    phone: '+880 1711 204 553',
    email: 'farhana.rahman@remeet.health',
    roomNo: '402',
    consultationFee: 1500,
    experienceYears: 16,
    rating: 4.9,
    patientsSeen: 8420,
    availableDays: ['Sun', 'Mon', 'Tue', 'Thu'],
    slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '16:00', '16:30', '17:00'],
  },
  {
    id: 'doc_02',
    name: 'Dr. Imran Chowdhury',
    department: 'GENM',
    specialty: 'Internal Medicine',
    qualifications: 'MBBS, FCPS (Medicine)',
    regNo: 'BMDC-A-51907',
    phone: '+880 1819 337 210',
    email: 'imran.chowdhury@remeet.health',
    roomNo: '108',
    consultationFee: 800,
    experienceYears: 11,
    rating: 4.7,
    patientsSeen: 6115,
    availableDays: ['Sun', 'Mon', 'Wed', 'Thu', 'Sat'],
    slots: ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '17:00', '17:30'],
  },
  {
    id: 'doc_03',
    name: 'Dr. Nusrat Jahan',
    department: 'PEDS',
    specialty: 'Neonatology',
    qualifications: 'MBBS, DCH, FCPS (Paediatrics)',
    regNo: 'BMDC-A-46882',
    phone: '+880 1712 889 004',
    email: 'nusrat.jahan@remeet.health',
    roomNo: '215',
    consultationFee: 900,
    experienceYears: 14,
    rating: 4.9,
    patientsSeen: 7340,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu'],
    slots: ['10:00', '10:30', '11:00', '11:30', '12:00', '15:30', '16:00'],
  },
  {
    id: 'doc_04',
    name: 'Dr. Sabina Akter',
    department: 'OBGY',
    specialty: 'Obstetrics & Gynaecology',
    qualifications: 'MBBS, FCPS (Obs & Gynae)',
    regNo: 'BMDC-A-44120',
    phone: '+880 1913 552 778',
    email: 'sabina.akter@remeet.health',
    roomNo: '310',
    consultationFee: 1100,
    experienceYears: 18,
    rating: 4.8,
    patientsSeen: 9260,
    availableDays: ['Sun', 'Tue', 'Wed', 'Sat'],
    slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '16:30', '17:00', '17:30'],
  },
  {
    id: 'doc_05',
    name: 'Dr. Tanvir Hasan',
    department: 'ORTH',
    specialty: 'Orthopaedic Surgery',
    qualifications: 'MBBS, MS (Orthopaedics)',
    regNo: 'BMDC-A-49765',
    phone: '+880 1671 442 019',
    email: 'tanvir.hasan@remeet.health',
    roomNo: '221',
    consultationFee: 1200,
    experienceYears: 13,
    rating: 4.6,
    patientsSeen: 5480,
    availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
    slots: ['08:30', '09:00', '09:30', '10:00', '16:00', '16:30', '17:00'],
  },
  {
    id: 'doc_06',
    name: 'Dr. Anika Sultana',
    department: 'RADI',
    specialty: 'Diagnostic Radiology',
    qualifications: 'MBBS, DMRD, FCPS (Radiology)',
    regNo: 'BMDC-A-52338',
    phone: '+880 1755 690 331',
    email: 'anika.sultana@remeet.health',
    roomNo: 'B-04',
    consultationFee: 700,
    experienceYears: 9,
    rating: 4.7,
    patientsSeen: 4120,
    availableDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    slots: ['09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20'],
  },
  {
    id: 'doc_07',
    name: 'Dr. Mahmudul Karim',
    department: 'GENM',
    specialty: 'Diabetology',
    qualifications: 'MBBS, MD (Endocrinology)',
    regNo: 'BMDC-A-47591',
    phone: '+880 1622 108 447',
    email: 'mahmudul.karim@remeet.health',
    roomNo: '112',
    consultationFee: 1000,
    experienceYears: 15,
    rating: 4.8,
    patientsSeen: 7890,
    availableDays: ['Sun', 'Tue', 'Thu', 'Sat'],
    slots: ['09:30', '10:00', '10:30', '11:00', '11:30', '17:00', '17:30', '18:00'],
  },
  {
    id: 'doc_08',
    name: 'Dr. Rezwana Haque',
    department: 'CARD',
    specialty: 'Non-invasive Cardiology',
    qualifications: 'MBBS, D-Card',
    regNo: 'BMDC-A-53844',
    phone: '+880 1788 231 660',
    email: 'rezwana.haque@remeet.health',
    roomNo: '405',
    consultationFee: 1300,
    experienceYears: 8,
    rating: 4.6,
    patientsSeen: 3260,
    availableDays: ['Mon', 'Wed', 'Sat'],
    slots: ['15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
  },
]

/* ---------------------------------------------------------------------------
   Patients
--------------------------------------------------------------------------- */

const PATIENT_SEED: Array<
  [name: string, dob: string, gender: Patient['gender'], blood: Patient['bloodGroup']]
> = [
  ['Rafiqul Islam', '1979-04-12', 'male', 'B+'],
  ['Shirin Akhter', '1986-11-03', 'female', 'O+'],
  ['Kamal Uddin', '1962-02-27', 'male', 'A+'],
  ['Nadia Parvin', '1994-07-19', 'female', 'AB+'],
  ['Arif Mahmud', '2001-09-08', 'male', 'O-'],
  ['Ruma Begum', '1971-01-15', 'female', 'B-'],
  ['Sohel Rana', '1989-05-22', 'male', 'A-'],
  ['Tahmina Yasmin', '1997-12-30', 'female', 'O+'],
  ['Jahangir Alam', '1956-08-06', 'male', 'AB-'],
  ['Marufa Khatun', '2019-03-14', 'female', 'B+'],
  ['Sajib Hossain', '1992-10-25', 'male', 'A+'],
  ['Farzana Kabir', '1983-06-11', 'female', 'O+'],
  ['Abdur Rahim', '1968-09-29', 'male', 'B+'],
  ['Sumaiya Islam', '2016-12-02', 'female', 'A+'],
  ['Mizanur Rahman', '1975-03-18', 'male', 'O+'],
  ['Rubina Sultana', '1990-08-24', 'female', 'AB+'],
  ['Delwar Hossain', '1959-11-09', 'male', 'A+'],
  ['Nazma Begum', '1980-02-05', 'female', 'B+'],
  ['Ashikur Zaman', '2004-07-31', 'male', 'O+'],
  ['Lubna Ahmed', '1996-04-17', 'female', 'A-'],
  ['Habibur Rahman', '1949-10-12', 'male', 'B+'],
  ['Sadia Afrin', '1999-01-26', 'female', 'O+'],
  ['Nurul Amin', '1972-05-04', 'male', 'AB+'],
  ['Ishrat Jahan', '2021-06-20', 'female', 'A+'],
]

const AREAS = [
  'Dhanmondi, Dhaka',
  'Gulshan-2, Dhaka',
  'Uttara Sector 7, Dhaka',
  'Mirpur DOHS, Dhaka',
  'Bashundhara R/A, Dhaka',
  'Mohammadpur, Dhaka',
  'Banani, Dhaka',
  'Shyamoli, Dhaka',
]

const ALLERGIES = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Peanuts', 'Dust mite', 'Latex']
const CONDITIONS = [
  'Type 2 diabetes',
  'Hypertension',
  'Asthma',
  'Hypothyroidism',
  'Chronic gastritis',
  'Iron-deficiency anaemia',
  'Osteoarthritis',
]

export const patients: Patient[] = PATIENT_SEED.map(([name, dob, gender, bloodGroup], i) => {
  const r = rng(1000 + i * 37)
  const allergyCount = r() > 0.62 ? 1 : 0
  const conditionCount = r() > 0.45 ? int(r, 1, 2) : 0
  return {
    id: `pat_${String(i + 1).padStart(2, '0')}`,
    mrn: `RM-${YEAR}-${String(1042 + i * 7).padStart(5, '0')}`,
    name,
    dob,
    gender,
    bloodGroup,
    phone: `+880 1${int(r, 3, 9)}${int(r, 10, 99)} ${int(r, 100, 999)} ${int(r, 100, 999)}`,
    email:
      r() > 0.35
        ? `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@gmail.com`
        : undefined,
    address: pick(r, AREAS),
    allergies: Array.from({ length: allergyCount }, () => pick(r, ALLERGIES)),
    conditions: Array.from(new Set(Array.from({ length: conditionCount }, () => pick(r, CONDITIONS)))),
    registeredAt: at(-int(r, 30, 900), 10),
    lastVisitAt: r() > 0.2 ? at(-int(r, 0, 90), int(r, 9, 17)) : undefined,
  }
})

/* ---------------------------------------------------------------------------
   Pharmacy inventory

   Expiry dates are spread deliberately: a few already past, several inside the
   90-day window, the rest comfortable — so the expiry banding in the inventory
   view has something real to show.
--------------------------------------------------------------------------- */

const MED_SEED: Array<
  [
    name: string,
    generic: string,
    strength: string,
    form: Medicine['form'],
    maker: string,
    price: number,
    rx: boolean,
  ]
> = [
  ['Napa', 'Paracetamol', '500mg', 'tablet', 'Beximco', 1.2, false],
  ['Napa Extend', 'Paracetamol', '665mg', 'tablet', 'Beximco', 1.8, false],
  ['Seclo', 'Omeprazole', '20mg', 'capsule', 'Square', 7, false],
  ['Losectil', 'Omeprazole', '20mg', 'capsule', 'Eskayef', 6.5, false],
  ['Monas', 'Montelukast', '10mg', 'tablet', 'Square', 16, true],
  ['Fexo', 'Fexofenadine', '120mg', 'tablet', 'Square', 9, false],
  ['Alatrol', 'Cetirizine', '10mg', 'tablet', 'Square', 2.5, false],
  ['Amdocal', 'Amlodipine', '5mg', 'tablet', 'Square', 4, true],
  ['Bisocard', 'Bisoprolol', '5mg', 'tablet', 'Incepta', 8, true],
  ['Cardilop', 'Clopidogrel', '75mg', 'tablet', 'Incepta', 14, true],
  ['Atova', 'Atorvastatin', '20mg', 'tablet', 'Square', 12, true],
  ['Rosuva', 'Rosuvastatin', '10mg', 'tablet', 'Renata', 15, true],
  ['Comet', 'Metformin', '500mg', 'tablet', 'Square', 3.5, true],
  ['Glimepiride', 'Glimepiride', '2mg', 'tablet', 'ACI', 6, true],
  ['Thyrox', 'Levothyroxine', '50mcg', 'tablet', 'Square', 4.5, true],
  ['Maxpro', 'Esomeprazole', '20mg', 'capsule', 'Renata', 9, false],
  ['Cef-3', 'Ceftriaxone', '1g', 'injection', 'Square', 180, true],
  ['Azithrocin', 'Azithromycin', '500mg', 'tablet', 'Square', 32, true],
  ['Amoxin', 'Amoxicillin', '500mg', 'capsule', 'ACI', 8, true],
  ['Ciprocin', 'Ciprofloxacin', '500mg', 'tablet', 'Square', 11, true],
  ['Fluclox', 'Flucloxacillin', '500mg', 'capsule', 'Beximco', 13, true],
  ['Doxicap', 'Doxycycline', '100mg', 'capsule', 'Renata', 6, true],
  ['Metryl', 'Metronidazole', '400mg', 'tablet', 'Opsonin', 2.2, true],
  ['Tufnil', 'Tolfenamic acid', '200mg', 'tablet', 'Square', 9, false],
  ['Etorix', 'Etoricoxib', '90mg', 'tablet', 'Incepta', 18, true],
  ['Naproxen', 'Naproxen', '500mg', 'tablet', 'ACI', 7.5, true],
  ['Deflux', 'Domperidone', '10mg', 'tablet', 'Square', 3, false],
  ['Emistat', 'Ondansetron', '8mg', 'tablet', 'Incepta', 12, true],
  ['Ventolin', 'Salbutamol', '100mcg', 'inhaler', 'GSK', 380, true],
  ['Seroflo', 'Salmeterol + Fluticasone', '250mcg', 'inhaler', 'Cipla', 720, true],
  ['Zimax Syrup', 'Azithromycin', '200mg/5ml', 'syrup', 'Square', 165, true],
  ['Napa Syrup', 'Paracetamol', '120mg/5ml', 'syrup', 'Beximco', 38, false],
  ['Ceevit', 'Ascorbic acid', '250mg', 'tablet', 'Square', 2, false],
  ['Aristovit-B', 'Vitamin B complex', '—', 'tablet', 'Aristopharma', 3.2, false],
  ['Calbo-D', 'Calcium + Vitamin D3', '500mg', 'tablet', 'Square', 5.5, false],
  ['Feroglobin', 'Ferrous fumarate', '305mg', 'capsule', 'Vitabiotics', 22, false],
  ['Fusidin', 'Fusidic acid', '2%', 'ointment', 'Square', 145, false],
  ['Dermosol', 'Clobetasol', '0.05%', 'ointment', 'Incepta', 98, true],
  ['Optimol', 'Timolol', '0.5%', 'drops', 'Square', 120, true],
  ['Ciprocin Eye', 'Ciprofloxacin', '0.3%', 'drops', 'Square', 85, true],
  ['Insulin 30/70', 'Human insulin', '100IU/ml', 'injection', 'Novo Nordisk', 480, true],
  ['Ecosprin', 'Aspirin', '75mg', 'tablet', 'Square', 1.5, true],
]

export const medicines: Medicine[] = MED_SEED.map(
  ([name, generic, strength, form, manufacturer, unitPrice, prescriptionOnly], i) => {
    const r = rng(5000 + i * 91)
    // A deliberate spread: ~5% expired, ~15% inside 90 days, rest healthy.
    const roll = r()
    const expiryDays = roll < 0.05 ? -int(r, 5, 60) : roll < 0.2 ? int(r, 8, 88) : int(r, 150, 900)
    const stockRoll = r()
    const reorderLevel = int(r, 20, 60)
    const stock =
      stockRoll < 0.07 ? 0 : stockRoll < 0.22 ? int(r, 1, reorderLevel - 1) : int(r, reorderLevel, 600)

    return {
      id: `med_${String(i + 1).padStart(2, '0')}`,
      sku: `SKU-${String(4100 + i * 13)}`,
      name,
      generic,
      strength,
      form,
      manufacturer,
      unitPrice,
      stock,
      reorderLevel,
      expiry: on(expiryDays),
      batchNo: `B${int(r, 20, 26)}${String(int(r, 100, 999))}`,
      rack: `${String.fromCharCode(65 + int(r, 0, 5))}-${int(r, 1, 9)}`,
      prescriptionOnly,
    }
  },
)

/* ---------------------------------------------------------------------------
   Appointments — spread across the current month, with today populated
--------------------------------------------------------------------------- */

const REASONS = [
  'Chest discomfort on exertion',
  'Follow-up: blood pressure review',
  'Fever and sore throat, 3 days',
  'Routine antenatal check',
  'Child immunisation — 18 months',
  'Knee pain after fall',
  'Diabetes review with HbA1c',
  'Persistent cough, 2 weeks',
  'Ultrasound — upper abdomen',
  'Headache and blurred vision',
  'Post-operative wound review',
  'Palpitations at rest',
  'Skin rash on forearms',
  'Annual health screening',
]

function buildAppointments(): Appointment[] {
  const out: Appointment[] = []
  const r = rng(90210)
  let seq = 0

  // −20 days through +14 days gives history, a busy today, and a bookable future.
  for (let day = -20; day <= 14; day++) {
    const isPast = day < 0
    const count = day === 0 ? 11 : int(r, 3, 8)

    for (let k = 0; k < count; k++) {
      const doctor = pick(r, doctors)
      const patient = pick(r, patients)
      const slot = pick(r, doctor.slots)
      const [h, m] = slot.split(':').map(Number)

      let status: AppointmentStatus
      if (isPast) {
        const roll = r()
        status = roll < 0.82 ? 'completed' : roll < 0.92 ? 'cancelled' : 'no-show'
      } else if (day === 0) {
        // Today reads like a real clinic mid-session.
        const roll = r()
        status =
          roll < 0.36 ? 'completed' : roll < 0.48 ? 'in-consult' : roll < 0.72 ? 'checked-in' : 'scheduled'
      } else {
        status = r() < 0.94 ? 'scheduled' : 'cancelled'
      }

      seq++
      out.push({
        id: `apt_${String(seq).padStart(4, '0')}`,
        patientId: patient.id,
        doctorId: doctor.id,
        department: doctor.department,
        start: at(day, h ?? 9, m ?? 0),
        durationMin: doctor.department === 'RADI' ? 20 : 30,
        status,
        reason: pick(r, REASONS),
        queueNo:
          day === 0 && (status === 'checked-in' || status === 'in-consult') ? int(r, 1, 12) : undefined,
        createdAt: at(day - int(r, 1, 12), int(r, 9, 18)),
      })
    }
  }

  return out.sort((a, b) => a.start.localeCompare(b.start))
}

export const appointments: Appointment[] = buildAppointments()

/* ---------------------------------------------------------------------------
   Prescriptions — issued against completed appointments
--------------------------------------------------------------------------- */

const DIAGNOSES: Array<[diagnosis: string, complaints: string, meds: string[], advice: string[], labs: string[]]> = [
  [
    'Acute pharyngitis',
    'Sore throat, fever, difficulty swallowing for 3 days',
    ['Azithrocin', 'Napa', 'Alatrol'],
    ['Warm saline gargle twice daily', 'Plenty of fluids', 'Return if fever persists past 48 hours'],
    ['CBC with ESR'],
  ],
  [
    'Essential hypertension, stage 1',
    'Occasional headache, reading 148/94 at home',
    ['Amdocal', 'Ecosprin'],
    ['Reduce added salt', 'Walk 30 minutes daily', 'Log home readings each morning'],
    ['Serum creatinine', 'Lipid profile', 'ECG'],
  ],
  [
    'Type 2 diabetes mellitus — inadequate control',
    'Increased thirst and night-time urination',
    ['Comet', 'Glimepiride', 'Aristovit-B'],
    ['Carbohydrate portion control', 'Check fasting sugar twice weekly', 'Daily foot inspection'],
    ['HbA1c', 'Fasting blood glucose', 'Urine R/E'],
  ],
  [
    'Acute gastritis',
    'Burning epigastric pain, worse after meals',
    ['Seclo', 'Deflux', 'Metryl'],
    ['Avoid spicy and oily food', 'Small frequent meals', 'No NSAIDs'],
    ['H. pylori stool antigen'],
  ],
  [
    'Bronchial asthma — mild persistent',
    'Night-time cough and wheeze, 2 weeks',
    ['Monas', 'Ventolin', 'Fexo'],
    ['Avoid dust and cold air', 'Use inhaler with spacer', 'Bring the inhaler to every visit'],
    ['Spirometry', 'Chest X-ray P/A'],
  ],
  [
    'Osteoarthritis, right knee',
    'Pain on stairs, morning stiffness',
    ['Etorix', 'Calbo-D'],
    ['Quadriceps strengthening exercises', 'Avoid squatting', 'Cold pack after activity'],
    ['X-ray right knee, standing AP'],
  ],
  [
    'Iron-deficiency anaemia',
    'Fatigue, breathlessness climbing stairs',
    ['Feroglobin', 'Ceevit'],
    ['Take iron with citrus, not with tea', 'Recheck haemoglobin in 6 weeks'],
    ['CBC', 'Serum ferritin'],
  ],
]

function buildPrescriptions(): Prescription[] {
  const completed = appointments.filter((a) => a.status === 'completed')
  const r = rng(31337)
  const out: Prescription[] = []

  completed.forEach((apt, i) => {
    if (r() > 0.72) return // not every consult ends in a prescription

    const [diagnosis, complaints, medNames, advice, labTests] = pick(r, DIAGNOSES)
    const items = medNames
      .map((n) => medicines.find((m) => m.name === n))
      .filter((m): m is Medicine => Boolean(m))
      .map((m) => ({
        medicineId: m.id,
        name: m.name,
        generic: m.generic,
        strength: m.strength,
        form: m.form,
        dosage:
          m.form === 'inhaler'
            ? { morning: 2, noon: 0, night: 2 }
            : pick(r, [
                { morning: 1, noon: 0, night: 1 },
                { morning: 1, noon: 1, night: 1 },
                { morning: 0, noon: 0, night: 1 },
                { morning: 1, noon: 0, night: 0 },
              ]),
        timing: pick(r, ['after-meal', 'before-meal', 'anytime'] as const),
        durationDays: pick(r, [5, 7, 10, 14, 30]),
        instructions: r() > 0.75 ? 'Stop and call the clinic if a rash appears.' : undefined,
      }))

    out.push({
      id: `rx_${String(out.length + 1).padStart(4, '0')}`,
      code: `RX-${YEAR}-${String(3100 + i * 3).padStart(5, '0')}`,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      appointmentId: apt.id,
      issuedAt: apt.start,
      complaints,
      diagnosis,
      vitals: {
        bp: `${int(r, 106, 152)}/${int(r, 68, 96)}`,
        pulse: int(r, 62, 98),
        tempF: Number((97 + r() * 4).toFixed(1)),
        weightKg: int(r, 14, 92),
        spo2: int(r, 95, 99),
      },
      items,
      advice,
      labTests: r() > 0.4 ? labTests : [],
      followUpAt: r() > 0.45 ? at(int(r, 7, 30), 10) : undefined,
    })
  })

  return out
}

export const prescriptions: Prescription[] = buildPrescriptions()

/* ---------------------------------------------------------------------------
   Invoices & POS sales
--------------------------------------------------------------------------- */

const LAB_ITEMS: Array<[string, number]> = [
  ['Complete blood count', 450],
  ['Lipid profile', 1200],
  ['HbA1c', 900],
  ['Serum creatinine', 400],
  ['Ultrasound — upper abdomen', 1800],
  ['Chest X-ray P/A', 700],
  ['ECG', 500],
  ['Echocardiography', 2800],
  ['Urine R/E', 300],
]

function buildInvoices(): Invoice[] {
  const r = rng(778899)
  const out: Invoice[] = []

  appointments
    .filter((a) => a.status === 'completed' || a.status === 'in-consult')
    .forEach((apt, i) => {
      const doctor = doctors.find((d) => d.id === apt.doctorId)!
      const lines = [
        {
          label: 'Consultation',
          detail: `${doctor.name} · ${doctor.specialty}`,
          qty: 1,
          unitPrice: doctor.consultationFee,
        },
      ]

      let kind: Invoice['kind'] = 'consultation'
      if (r() > 0.55) {
        const labCount = int(r, 1, 3)
        for (let k = 0; k < labCount; k++) {
          const [label, price] = pick(r, LAB_ITEMS)
          lines.push({ label, detail: 'Ultrasound & Lab', qty: 1, unitPrice: price })
        }
        kind = 'mixed'
      }

      const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
      const discountPct = r() > 0.78 ? pick(r, [5, 10, 15]) : 0
      const total = Math.round(subtotal * (1 - discountPct / 100))
      const statusRoll = r()
      const status: Invoice['status'] =
        statusRoll < 0.76 ? 'paid' : statusRoll < 0.88 ? 'partial' : 'unpaid'

      out.push({
        id: `inv_${String(i + 1).padStart(4, '0')}`,
        code: `INV-${YEAR}-${String(7200 + i * 4).padStart(5, '0')}`,
        patientId: apt.patientId,
        doctorId: apt.doctorId,
        kind,
        lines,
        discountPct,
        taxPct: 0,
        status,
        method: status === 'unpaid' ? undefined : pick(r, ['cash', 'card', 'mobile'] as const),
        issuedAt: apt.start,
        paidAt: status === 'paid' ? apt.start : undefined,
        paidAmount: status === 'paid' ? total : status === 'partial' ? Math.round(total * 0.5) : 0,
      })
    })

  return out.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
}

export const invoices: Invoice[] = buildInvoices()

function buildSales(): Sale[] {
  const r = rng(424242)
  const out: Sale[] = []
  const cashiers = ['Rumi Akter', 'Shafiq Ahmed', 'Nizam Uddin']
  const sellable = medicines.filter((m) => m.stock > 0)

  for (let day = -29; day <= 0; day++) {
    const count = int(r, 4, 14)
    for (let k = 0; k < count; k++) {
      const lineCount = int(r, 1, 4)
      const lines = Array.from({ length: lineCount }, () => {
        const m = pick(r, sellable)
        return {
          medicineId: m.id,
          name: m.name,
          strength: m.strength,
          qty: m.form === 'tablet' || m.form === 'capsule' ? int(r, 6, 30) : int(r, 1, 3),
          unitPrice: m.unitPrice,
        }
      })

      const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
      const discountPct = r() > 0.85 ? pick(r, [5, 10]) : 0

      out.push({
        id: `pos_${String(out.length + 1).padStart(4, '0')}`,
        code: `POS-${YEAR}-${String(8800 + out.length * 2).padStart(5, '0')}`,
        lines,
        discountPct,
        method: pick(r, ['cash', 'card', 'mobile'] as const),
        total: Math.round(subtotal * (1 - discountPct / 100)),
        soldAt: at(day, int(r, 9, 20), int(r, 0, 59)),
        cashier: pick(r, cashiers),
      })
    }
  }

  return out.sort((a, b) => b.soldAt.localeCompare(a.soldAt))
}

export const sales: Sale[] = buildSales()

export { at, on }
