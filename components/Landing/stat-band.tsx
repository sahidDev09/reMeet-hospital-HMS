'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import { gsap } from '@/components/motion/gsap'
import { useGsap } from '@/components/motion/use-gsap'
import { BlurOutUp } from '@/components/ui/blur-out-up'

export type StatBandProps = {
  patients?: number
  prescriptions?: number
  medicines?: number
  collectedThisMonth?: number
  brandName?: string
}

export function StatBand({ brandName = 'reMeet Hospital' }: StatBandProps) {
  const scope = useGsap<HTMLElement>((el) => {
    const badgeTech = el.querySelector('[data-anim="badge-tech"]')
    const badgeAvatars = el.querySelector('[data-anim="badge-avatars"]')
    const cta = el.querySelector('[data-anim="cta"]')

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      defaults: { ease: 'power3.out' },
    })

    if (badgeTech) {
      tl.fromTo(
        badgeTech,
        { opacity: 0, scale: 0.5, rotate: -8 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(2)' },
        0.35,
      )
    }

    if (badgeAvatars) {
      tl.fromTo(
        badgeAvatars,
        { opacity: 0, scale: 0.5, x: -8 },
        { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: 'back.out(2)' },
        0.5,
      )
    }

    if (cta) {
      tl.fromTo(
        cta,
        { opacity: 0, y: 25, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'back.out(1.6)' },
        0.8,
      )
    }
  })

  return (
    <section
      ref={scope}
      className="relative overflow-hidden border-y border-line/60 bg-gradient-to-b from-bg/40 via-bg to-bg/80 py-20 sm:py-28 lg:py-32"
    >
      {/* Honeycomb decorative pattern (Left) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 top-1/2 h-[380px] w-[320px] -translate-y-1/2 select-none opacity-20 dark:opacity-10 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        viewBox="0 0 300 400"
      >
        <defs>
          <pattern id="hex-pattern-left" width="56" height="96" patternUnits="userSpaceOnUse">
            <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 L28 128 L0 112 L0 80 Z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pattern-left)" />
      </svg>

      {/* Honeycomb decorative pattern (Right) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 top-1/2 h-[380px] w-[320px] -translate-y-1/2 select-none opacity-20 dark:opacity-10 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        viewBox="0 0 300 400"
      >
        <defs>
          <pattern id="hex-pattern-right" width="56" height="96" patternUnits="userSpaceOnUse">
            <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 L28 128 L0 112 L0 80 Z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-pattern-right)" />
      </svg>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        {/* Eyebrow Label */}
        <div className="mb-6 flex items-center justify-center gap-3.5">
          <span className="h-px w-9 bg-ink-faint/30 dark:bg-ink-faint/20" />
          <BlurOutUp
            triggerOnView
            delay={0}
            stagger={25}
            className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-ink-faint"
          >
            {brandName}
          </BlurOutUp>
          <span className="h-px w-9 bg-ink-faint/30 dark:bg-ink-faint/20" />
        </div>

        {/* Main Headline Statement */}
        <h2 className="mx-auto max-w-4xl text-center font-display text-[1.85rem] font-normal leading-[1.32] tracking-[-0.03em] text-ink/75 dark:text-ink/85 sm:text-4xl md:text-[2.75rem] md:leading-[1.26]">
          <BlurOutUp
            triggerOnView
            delay={100}
            stagger={30}
            className="font-semibold text-ink"
          >
            We combine innovative
          </BlurOutUp>{' '}
          <span
            data-anim="badge-tech"
            className="inline-flex items-center justify-center align-middle mx-1.5 px-3 py-1 -mt-1 rounded-full border border-sky-300/60 dark:border-sky-700/50 bg-gradient-to-r from-sky-100/90 to-blue-100/80 dark:from-sky-950/60 dark:to-blue-900/40 shadow-sm"
          >
            <span className="text-base sm:text-lg leading-none select-none">💡</span>
          </span>{' '}
          <BlurOutUp
            triggerOnView
            delay={220}
            stagger={26}
          >
            technologies with a human approach to make every patient
          </BlurOutUp>{' '}
          <span
            data-anim="badge-avatars"
            className="inline-flex items-center align-middle mx-1.5 -space-x-2.5 -mt-1 rounded-full p-0.5 border border-white/80 dark:border-white/15 bg-white/70 dark:bg-surface-solid shadow-sm"
          >
            <Image
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=96&h=96&q=80"
              alt="Medical Team Member 1"
              width={28}
              height={28}
              className="size-7 rounded-full object-cover ring-2 ring-white dark:ring-surface-solid"
            />
            <Image
              src="https://images.unsplash.com/photo-1594824813620-3b08e5e6df7e?auto=format&fit=crop&w=96&h=96&q=80"
              alt="Medical Team Member 2"
              width={28}
              height={28}
              className="size-7 rounded-full object-cover ring-2 ring-white dark:ring-surface-solid"
            />
            <Image
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=96&h=96&q=80"
              alt="Medical Team Member 3"
              width={28}
              height={28}
              className="size-7 rounded-full object-cover ring-2 ring-white dark:ring-surface-solid"
            />
          </span>{' '}
          <BlurOutUp
            triggerOnView
            delay={440}
            stagger={30}
            className="font-semibold text-ink"
          >
            feel confident and calm.
          </BlurOutUp>
        </h2>

        {/* Subtitle Description */}
        <BlurOutUp
          triggerOnView
          delay={580}
          stagger={16}
          className="mx-auto mt-7 block max-w-2xl text-center text-sm leading-relaxed text-ink-soft sm:text-base"
        >
          Our hospital is a space of trust, modern medicine and care, based on many years of experience and love for people
        </BlurOutUp>

        {/* Action Button */}
        <div data-anim="cta" className="mt-8 flex justify-center">
          <Link
            href="#doctors"
            className="group relative inline-flex items-center gap-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-1.5 pl-6 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.03] active:scale-[0.98]"
          >
            <span>More about us</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-md transition-transform duration-300 group-hover:rotate-12">
              <User className="size-4 stroke-[2.5]" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
