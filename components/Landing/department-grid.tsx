import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { money } from '@/lib/format'
import type { Department } from '@/lib/data/types'

const DEPARTMENT_META: Record<
  string,
  {
    index: string
    image: string
    pillClass: string
  }
> = {
  GENM: {
    index: '01',
    image: '/images/departments/genm.jpg',
    pillClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/40 dark:border-sky-700/40',
  },
  PEDS: {
    index: '02',
    image: '/images/departments/peds.jpg',
    pillClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-300/40 dark:border-orange-700/40',
  },
  OBGY: {
    index: '03',
    image: '/images/departments/obgy.jpg',
    pillClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-700/40',
  },
  CARD: {
    index: '04',
    image: '/images/departments/card.jpg',
    pillClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300/40 dark:border-cyan-700/40',
  },
  RADI: {
    index: '05',
    image: '/images/departments/radi.jpg',
    pillClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-700/40',
  },
  ORTH: {
    index: '06',
    image: '/images/departments/orth.jpg',
    pillClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-700/40',
  },
}

export function DepartmentGrid({
  departments,
  doctorCounts,
}: {
  departments: Department[]
  doctorCounts: Record<string, number>
}) {
  return (
    <section id="departments" className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      {/* Top Header Section */}
      <div className="mb-10 flex flex-col gap-3">
        <p className="eyebrow text-accent">Departments</p>
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
          Six departments, one patient file between them.
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          A referral from Family Medicine to Cardiology carries the history, the vitals and the
          current medication with it. Nobody starts a new form.
        </p>
      </div>

      {/* 3-Column Full-Cover Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const meta = DEPARTMENT_META[dept.code] ?? {
            index: '00',
            image: '/images/departments/genm.jpg',
            pillClass: 'bg-accent-soft text-accent border-line',
          }

          return (
            <article
              key={dept.code}
              className="group relative flex min-h-[350px] sm:min-h-[370px] flex-col justify-between overflow-hidden rounded-[26px] sm:rounded-[30px] border border-line/70 bg-surface-solid shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.09)] dark:hover:shadow-[0_20px_44px_rgba(0,0,0,0.4)]"
            >
              {/* Full Box Cover Image Background */}
              <div className="absolute inset-0 h-full w-full overflow-hidden">
                <Image
                  src={meta.image}
                  alt={dept.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-right sm:object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/20 dark:from-surface-solid/95 dark:via-surface-solid/85 dark:to-surface-solid/25" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/30 dark:from-surface-solid/90 dark:via-transparent dark:to-surface-solid/30" />
              </div>

              {/* Top Row: Index & Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2 p-6 sm:p-7 pb-0">
                <span className="font-mono text-sm font-bold tracking-tight text-ink/70 dark:text-ink/80">
                  {meta.index}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.6875rem] font-semibold tracking-wider backdrop-blur-md ${meta.pillClass}`}
                  >
                    {dept.code}
                  </span>
                  <span className="rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md border border-line/50 px-2.5 py-0.5 font-mono text-[0.6875rem] text-ink-faint">
                    {doctorCounts[dept.code] ?? 0} docs
                  </span>
                </div>
              </div>

              {/* Middle Content Section */}
              <div className="relative z-10 my-auto px-6 sm:px-7 max-w-[76%] sm:max-w-[72%]">
                <h3 className="font-display text-xl sm:text-[1.35rem] font-bold tracking-tight text-ink">
                  {dept.name}
                </h3>
                <p className="mt-2 text-xs sm:text-[0.8125rem] leading-relaxed text-ink-soft line-clamp-3">
                  {dept.blurb}
                </p>

                {/* Service tags */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {dept.services.slice(0, 2).map((service) => (
                    <span
                      key={service}
                      className="rounded-md border border-line/60 bg-white/75 dark:bg-black/35 px-2 py-0.5 text-[0.6875rem] font-medium text-ink-soft backdrop-blur-md"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Row: Circular Action Button & Consultation Fee */}
              <div className="relative z-10 flex items-center justify-between p-6 sm:p-7 pt-3 border-t border-line/40 backdrop-blur-sm bg-white/30 dark:bg-black/20">
                <Link
                  href={`/appointments?department=${dept.code}`}
                  aria-label={`Book appointment in ${dept.name}`}
                  className="group/btn inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-white shadow-md shadow-emerald-600/25 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-emerald-600/40 hover:brightness-110 active:scale-95"
                >
                  <ArrowRight className="size-4 stroke-[2.4] transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </Link>

                <div className="text-right">
                  <span className="block text-[0.6875rem] uppercase tracking-wider text-ink-faint">
                    Consultation
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink tabular">
                    from {money(dept.fromPrice)}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default DepartmentGrid
