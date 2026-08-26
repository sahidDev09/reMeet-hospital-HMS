import { Star } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/motion/reveal'
import { initials, money, num } from '@/lib/format'
import type { Doctor } from '@/lib/data/types'

/**
 * The roster, with the things a patient actually chooses on: which days the
 * doctor sits, what a visit costs, and how long they have been practising.
 * Photographs are omitted on purpose — a real deployment pulls those from staff
 * records, and placeholder faces would be a lie about the data.
 */
export function DoctorRail({ doctors }: { doctors: Doctor[] }) {
  return (
    <section id="doctors" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <Reveal className="mb-10 flex flex-col gap-3">
        <p className="eyebrow text-accent">Doctors</p>
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
          Who is sitting, and when.
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          Chambers, fees and available days, kept current by the same roster the booking screen
          reads.
        </p>
      </Reveal>

      <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {doctors.map((doc) => (
          <article
            key={doc.id}
            data-reveal
            className="glass flex flex-col gap-3.5 rounded-2xl p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft font-display text-sm font-semibold text-accent">
                {initials(doc.name)}
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-display text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
                  {doc.name}
                </h3>
                <p className="truncate text-xs text-ink-soft">{doc.specialty}</p>
              </div>
            </div>

            <p className="font-mono text-[0.6875rem] leading-relaxed text-ink-faint">
              {doc.qualifications}
            </p>

            <div className="flex flex-wrap gap-1">
              {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => {
                const sits = doc.availableDays.includes(day)
                return (
                  <span
                    key={day}
                    aria-label={`${day}: ${sits ? 'available' : 'not available'}`}
                    className={
                      sits
                        ? 'rounded border border-accent/25 bg-accent-soft px-1.5 py-0.5 font-mono text-[0.625rem] font-medium text-accent'
                        : 'rounded border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-faint/70'
                    }
                  >
                    {day.slice(0, 2)}
                  </span>
                )
              })}
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
              <span className="flex items-center gap-1 font-mono text-[0.6875rem] text-ink-soft">
                <Star className="size-3 fill-vital-warn text-vital-warn" />
                {doc.rating.toFixed(1)}
                <span className="text-ink-faint">· {num(doc.patientsSeen)} seen</span>
              </span>
              <span className="font-mono text-xs font-medium text-ink tabular">
                {money(doc.consultationFee)}
              </span>
            </div>

            <Link
              href={`/appointments?doctorId=${doc.id}`}
              className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Book with {doc.name.split(' ').slice(-1)[0]} →
            </Link>
          </article>
        ))}
      </Reveal>
    </section>
  )
}
