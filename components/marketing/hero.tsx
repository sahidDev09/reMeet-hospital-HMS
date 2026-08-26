'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { PulseLine } from '@/components/brand/pulse-line'
import { gsap } from '@/components/motion/gsap'
import { useGsap } from '@/components/motion/use-gsap'
import { CountUp } from '@/components/motion/count-up'
import { Button } from '@/components/ui/button'
import { CURRENCY, money, time } from '@/lib/format'

export type HeroQueueRow = {
  queueNo: number
  patient: string
  doctor: string
  department: string
  start: string
  state: 'In consult' | 'Waiting'
}

/**
 * The hero opens with the most characteristic thing in this product's world: the
 * clinic's own board, mid-session, with real numbers on it. Not a stock photo of
 * a stethoscope and not an abstract illustration — the working screen.
 *
 * One orchestrated load sequence rather than scattered effects: the cardiac trace
 * draws across the page, the headline lines swing up behind their own mask, the
 * supporting copy settles, then the board arrives and its figures count. Every
 * tween is a `from`, so the finished state is what's in the HTML — nothing is
 * hidden if JavaScript never runs.
 */
export function Hero({
  revenueToday,
  consultsToday,
  departmentCount,
  revenueTrend,
  queue,
}: {
  revenueToday: number
  consultsToday: number
  departmentCount: number
  revenueTrend: number[]
  queue: HeroQueueRow[]
}) {
  const scope = useGsap<HTMLDivElement>((el) => {
    const q = gsap.utils.selector(el)
    const trace = el.querySelector<SVGPathElement>('[data-pulse]')
    const traceLength = Number(trace?.dataset.length ?? 0)

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    if (trace) {
      tl.fromTo(
        trace,
        { strokeDashoffset: traceLength },
        { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' },
        0,
      )
    }

    tl.from(q('[data-line]'), { yPercent: 112, duration: 0.9, stagger: 0.08 }, 0.2)
      .from(q('[data-fade]'), { opacity: 0, y: 16, duration: 0.7, stagger: 0.08 }, 0.62)
      .from(q('[data-board]'), { opacity: 0, y: 26, scale: 0.985, duration: 0.9 }, 0.8)
      .from(q('[data-board-row]'), { opacity: 0, x: 12, duration: 0.5, stagger: 0.07 }, 1.02)
  })

  return (
    <section ref={scope} className="relative overflow-hidden">
      {/* One ambient wash, and the trace. Nothing else behind the type. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[38%] -z-0 opacity-[0.16]"
      >
        <PulseLine variant="hero" beats={4} draw strokeWidth={2} className="h-64 w-full" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        {/* --- Left: the thesis --- */}
        <div className="flex flex-col">
          <p data-fade className="eyebrow mb-5 text-accent">
            Hospital management · Dhaka
          </p>

          <h1 className="font-display text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.035em] text-ink sm:text-6xl">
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">
                The whole visit,
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span data-line className="block">
                on one record.
              </span>
            </span>
          </h1>

          <p data-fade className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft">
            Booking, consultation, prescription, pharmacy and billing run on the same patient
            file. The front desk stops re-typing what the doctor already wrote.
          </p>

          <div data-fade className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open reMeet
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#flow">See how a visit works</a>
            </Button>
          </div>

          {/* Today's real figures, from the same data layer the dashboard reads. */}
          <dl
            data-fade
            className="mt-10 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line"
          >
            <Figure
              label={`Collected today`}
              value={
                <CountUp
                  value={revenueToday}
                  prefix={`${CURRENCY.symbol} `}
                  className="tabular"
                  delay={1.1}
                />
              }
            />
            <Figure
              label="Consults today"
              value={<CountUp value={consultsToday} className="tabular" delay={1.2} />}
            />
            <Figure
              label="Departments"
              value={<CountUp value={departmentCount} className="tabular" delay={1.3} />}
            />
          </dl>
        </div>

        {/* --- Right: the clinic's own board --- */}
        <div data-board className="glass relative rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-ink-faint">Live queue</p>
              <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                Today at the desk
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface-solid/70 px-2.5 py-1">
              <span className="relative grid size-2 place-items-center">
                <span className="absolute size-2 animate-ping rounded-full bg-vital-ok/60" />
                <span className="size-1.5 rounded-full bg-vital-ok" />
              </span>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-soft">
                Live
              </span>
            </span>
          </div>

          <ul className="mt-4 flex flex-col">
            {queue.map((row) => (
              <li
                key={row.queueNo}
                data-board-row
                className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft font-mono text-xs font-medium text-accent">
                  {String(row.queueNo).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{row.patient}</span>
                  <span className="block truncate text-xs text-ink-faint">
                    {row.doctor} · {row.department}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-xs text-ink-soft">{time(row.start)}</span>
                  <span
                    className={
                      row.state === 'In consult'
                        ? 'block font-mono text-[0.625rem] uppercase tracking-[0.08em] text-vital-ok'
                        : 'block font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-faint'
                    }
                  >
                    {row.state}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-end justify-between gap-4 rounded-xl border border-line bg-surface-solid/50 p-3">
            <div>
              <p className="eyebrow text-ink-faint">Revenue, last 7 days</p>
              <p className="font-display text-xl font-semibold tracking-[-0.02em] text-ink tabular">
                {money(revenueTrend.reduce((s, v) => s + v, 0))}
              </p>
            </div>
            <PulseLine
              variant="spark"
              data={revenueTrend}
              className="h-9 w-28 shrink-0 text-accent"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-bg px-3.5 py-3">
      <dt className="eyebrow text-ink-faint">{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold tracking-[-0.02em] text-ink">
        {value}
      </dd>
    </div>
  )
}
