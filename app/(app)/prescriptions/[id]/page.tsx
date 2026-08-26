import type { Metadata } from 'next'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PrintButton } from '@/components/app/print-button'
import { CLINIC, PrintSheet } from '@/components/app/print-sheet'
import { Button } from '@/components/ui/button'
import { getRole } from '@/lib/auth/roles'
import { getPrescription } from '@/lib/data/prescriptions'
import { age, date, dateTime, dosage } from '@/lib/format'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const rx = await getPrescription((await params).id)
  return { title: rx ? `${rx.code} · ${rx.patient.name}` : 'Prescription not found' }
}

const TIMING_LABEL: Record<string, string> = {
  'before-meal': 'Before meals',
  'after-meal': 'After meals',
  anytime: 'Any time',
}

/**
 * A prescription, as paper.
 *
 * This is the one screen designed for a printer first and a monitor second. It
 * follows the sheet a Bangladeshi outpatient actually carries out of the chamber:
 * ℞ on the left, patient block up top, medicines in a numbered list with the
 * dosage in `1-0-1` notation, advice and tests underneath, signature and BMDC
 * registration at the bottom.
 *
 * Printing is the browser's own engine at A5 — vector text, selectable, correct
 * margins, and no font bundle to ship. That's a better sheet than a rasterised
 * PDF, which is why there's no jsPDF here.
 */
export default async function PrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const [rx, role] = await Promise.all([getPrescription((await params).id), getRole()])
  if (!rx) notFound()

  const { patient, doctor, vitals } = rx
  const vitalPairs = [
    vitals?.bp && { label: 'BP', value: vitals.bp },
    vitals?.pulse && { label: 'Pulse', value: `${vitals.pulse}/min` },
    vitals?.tempF && { label: 'Temp', value: `${vitals.tempF}°F` },
    vitals?.weightKg && { label: 'Weight', value: `${vitals.weightKg} kg` },
    vitals?.spo2 && { label: 'SpO₂', value: `${vitals.spo2}%` },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <>
      <div
        data-print="hide"
        className="mb-5 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <p className="eyebrow text-ink-faint">Prescription {rx.code}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
            {patient.name}
          </h1>
          <p className="text-sm text-ink-soft">
            {rx.diagnosis} · issued {dateTime(rx.issuedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href={`/patients/${patient.id}`}>
              <ArrowLeft className="size-4" />
              Patient file
            </Link>
          </Button>
          {/* The counter is the desk's job, so doctors don't get a link into it. */}
          {role !== 'doctor' ? (
            <Button asChild variant="outline">
              <Link href={`/pos?prescriptionId=${rx.id}`}>
                <ShoppingCart className="size-4" />
                Dispense at counter
              </Link>
            </Button>
          ) : null}
          <PrintButton label="Print prescription" />
        </div>
      </div>

      <PrintSheet docType="Prescription" docCode={rx.code} issuedOn={date(rx.issuedAt)}>
        {/* --- Patient block --- */}
        <section className="mt-4 grid grid-cols-[1fr_auto] gap-4 border-b border-line pb-3">
          <div>
            <p className="font-display text-base font-semibold text-ink">{patient.name}</p>
            <p className="font-mono text-[0.6875rem] text-ink-soft">
              {patient.mrn} · {age(patient.dob)} · {patient.gender} · {patient.bloodGroup}
            </p>
            {patient.allergies.length > 0 ? (
              <p className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-vital-crit print:text-black">
                Allergies: {patient.allergies.join(', ')}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[0.6875rem] text-ink-soft">{doctor.name}</p>
            <p className="font-mono text-[0.625rem] text-ink-faint">{doctor.qualifications}</p>
            <p className="font-mono text-[0.625rem] text-ink-faint">Room {doctor.roomNo}</p>
          </div>
        </section>

        {/* --- Vitals --- */}
        {vitalPairs.length > 0 ? (
          <section className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {vitalPairs.map((v) => (
              <span key={v.label} className="font-mono text-[0.6875rem] text-ink-soft">
                {v.label} <span className="font-medium text-ink">{v.value}</span>
              </span>
            ))}
          </section>
        ) : null}

        {/* --- Complaints and diagnosis --- */}
        <section className="mt-3 grid gap-2">
          <div>
            <p className="eyebrow text-ink-faint">Complaints</p>
            <p className="text-xs leading-relaxed text-ink">{rx.complaints}</p>
          </div>
          <div>
            <p className="eyebrow text-ink-faint">Diagnosis</p>
            <p className="text-xs font-medium leading-relaxed text-ink">{rx.diagnosis}</p>
          </div>
        </section>

        {/* --- Rx --- */}
        <section className="mt-4 flex gap-3" data-print="keep">
          <span
            aria-hidden
            className="font-display text-3xl font-semibold leading-none text-accent print:text-black"
          >
            ℞
          </span>
          <ol className="flex-1">
            {rx.items.map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-[1.25rem_1fr_auto] gap-x-2 border-b border-line py-2 last:border-0"
              >
                <span className="font-mono text-[0.6875rem] text-ink-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block text-xs font-semibold text-ink">
                    {item.name} <span className="font-mono font-normal">{item.strength}</span>
                  </span>
                  <span className="block text-[0.6875rem] capitalize text-ink-soft">
                    {item.form}
                    {item.generic ? ` · ${item.generic}` : ''}
                  </span>
                  {item.instructions ? (
                    <span className="block text-[0.6875rem] italic text-ink-soft">
                      {item.instructions}
                    </span>
                  ) : null}
                </span>
                <span className="text-right">
                  <span className="block font-mono text-xs font-semibold text-ink">
                    {dosage(item.dosage)}
                  </span>
                  <span className="block text-[0.625rem] text-ink-soft">
                    {item.durationDays} days
                  </span>
                  <span className="block text-[0.625rem] text-ink-faint">
                    {TIMING_LABEL[item.timing] ?? item.timing}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Advice and tests --- */}
        {rx.advice.length > 0 || rx.labTests.length > 0 ? (
          <section className="mt-4 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
            {rx.advice.length > 0 ? (
              <div>
                <p className="eyebrow text-ink-faint">Advice</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {rx.advice.map((a) => (
                    <li key={a} className="text-[0.6875rem] leading-relaxed text-ink">
                      · {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {rx.labTests.length > 0 ? (
              <div>
                <p className="eyebrow text-ink-faint">Investigations</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {rx.labTests.map((t) => (
                    <li key={t} className="text-[0.6875rem] leading-relaxed text-ink">
                      · {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* --- Follow-up + signature --- */}
        <section
          className="mt-5 flex items-end justify-between gap-6 border-t border-line pt-3"
          data-print="keep"
        >
          <div>
            {rx.followUpAt ? (
              <p className="text-[0.6875rem] text-ink">
                <span className="font-semibold">Follow up on {date(rx.followUpAt)}</span>
                <span className="block text-ink-soft">
                  Bring this sheet and any test reports.
                </span>
              </p>
            ) : (
              <p className="text-[0.6875rem] text-ink-soft">
                Return sooner if symptoms worsen. Emergency: 999.
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="mb-1 h-8 w-40 border-b border-ink/40" />
            <p className="text-[0.6875rem] font-semibold text-ink">{doctor.name}</p>
            <p className="font-mono text-[0.625rem] text-ink-soft">{doctor.qualifications}</p>
            <p className="font-mono text-[0.625rem] text-ink-faint">BMDC {doctor.regNo}</p>
          </div>
        </section>
      </PrintSheet>

      <p data-print="hide" className="mx-auto mt-4 max-w-[148mm] text-xs text-ink-faint">
        Prints at A5 with 12mm margins on {CLINIC.name} letterhead. Nothing from the app appears
        on the sheet.
      </p>
    </>
  )
}
