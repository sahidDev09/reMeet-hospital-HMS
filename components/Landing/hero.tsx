'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { gsap } from '@/components/motion/gsap'
import { useGsap } from '@/components/motion/use-gsap'
import { CountUp } from '@/components/motion/count-up'
import { Button } from '@/components/ui/button'
import { CURRENCY } from '@/lib/format'

export type HeroProps = {
  revenueToday: number
  consultsToday: number
  departmentCount: number
}

export function Hero({
  revenueToday,
  consultsToday,
  departmentCount,
}: HeroProps) {
  const scope = useGsap<HTMLDivElement>((el) => {
    const q = gsap.utils.selector(el)
    const dnaParallax = el.querySelector<HTMLElement>('[data-dna-parallax]')

    if (dnaParallax) {
      gsap.to(dnaParallax, {
        y: 140,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from(q('[data-line]'), { yPercent: 112, duration: 0.9, stagger: 0.08 }, 0.2)
      .from(q('[data-fade]'), { opacity: 0, y: 18, duration: 0.75, stagger: 0.09 }, 0.6)
  })

  return (
    <section
      ref={scope}
      className="relative flex min-h-[calc(100dvh-4rem)] w-full items-center overflow-hidden"
    >
      {/* Full-Cover DNA Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      >
        <div
          data-dna-parallax
          className="absolute inset-0 scale-115 md:scale-125 origin-center will-change-transform"
        >
          <Image
            src="/assets/landing/dna_whool.png"
            alt="DNA Helix Structure"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-center opacity-100 dark:opacity-100"
          />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
        <div className="flex max-w-xl flex-col">
          <p data-fade className="eyebrow mb-5 text-accent">
            Hospital management · Sylhet
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
            <Button asChild size="lg" className="shadow-lift">
              <Link href="/dashboard">
                Open reMeet
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg">
              <a href="#flow">See how a visit works</a>
            </Button>
          </div>

          {/* Today's real figures with high-translucency glass effect */}
          <dl
            data-fade
            className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-line/40 overflow-hidden rounded-2xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/[0.03] backdrop-blur-md backdrop-saturate-150 shadow-[0_8px_32px_0_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
          >
            <Figure
              label="Collected today"
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
      </div>
    </section>
  )
}

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5 transition-colors duration-200 hover:bg-white/10 dark:hover:bg-white/[0.04]">
      <dt className="eyebrow text-[0.625rem] text-ink-faint">{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold tracking-[-0.02em] text-ink sm:text-xl">
        {value}
      </dd>
    </div>
  )
}
