import Link from 'next/link'
import { Reveal } from '@/components/motion/reveal'
import { money } from '@/lib/format'
import type { Department } from '@/lib/data/types'

/**
 * Each card carries the department's real code — CARD, PEDS, OBGY — rather than a
 * sequence number.
 *
 * That's a deliberate departure from the usual 01/02/03 treatment: departments
 * have no order, so numbering them would be decoration pretending to be
 * structure. The code is the hospital's own shorthand, it's on the wristband and
 * the room sign, and it's the same key the app filters by. The label does a job.
 */
export function DepartmentGrid({
  departments,
  doctorCounts,
}: {
  departments: Department[]
  doctorCounts: Record<string, number>
}) {
  return (
    <section id="departments" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <Reveal className="mb-10 flex flex-col gap-3">
        <p className="eyebrow text-accent">Departments</p>
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
          Six departments, one patient file between them.
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          A referral from Family Medicine to Cardiology carries the history, the vitals and the
          current medication with it. Nobody starts a new form.
        </p>
      </Reveal>

      <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <article
            key={dept.code}
            data-reveal
            className="glass group flex flex-col gap-4 rounded-2xl p-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-md bg-accent-soft px-2 py-1 font-mono text-[0.6875rem] font-semibold tracking-[0.08em] text-accent">
                {dept.code}
              </span>
              <span className="font-mono text-[0.6875rem] text-ink-faint">
                {doctorCounts[dept.code] ?? 0} doctors
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                {dept.name}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">{dept.blurb}</p>
            </div>

            <ul className="flex flex-wrap gap-1.5">
              {dept.services.map((service) => (
                <li
                  key={service}
                  className="rounded-md border border-line px-2 py-0.5 text-[0.6875rem] text-ink-soft"
                >
                  {service}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-line pt-3.5">
              <span className="text-xs text-ink-faint">
                Consultation from{' '}
                <span className="font-mono text-ink-soft tabular">{money(dept.fromPrice)}</span>
              </span>
              <Link
                href={`/appointments?department=${dept.code}`}
                className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Book →
              </Link>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  )
}
