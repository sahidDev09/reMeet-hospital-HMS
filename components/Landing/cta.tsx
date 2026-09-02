'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowRight, Stethoscope, Activity, Dna } from 'lucide-react'

// Exact geometric data matching the stylized DNA helix dumbbell & sphere reference image
const DNA_ELEMENTS = [
  // Top trailing dots
  { type: 'dot', x: 74, y: 36, r: 12 },
  { type: 'dot', x: 96, y: 70, r: 10.5 },

  // Helical dumbbell rungs (paired spheres + connecting capsule rod)
  { type: 'rung', x1: 106, y1: 114, r1: 11.5, x2: 136, y2: 98, r2: 9.5, strokeWidth: 6 },
  { type: 'rung', x1: 90, y1: 160, r1: 12.5, x2: 162, y2: 136, r2: 10.5, strokeWidth: 7 },
  { type: 'rung', x1: 72, y1: 214, r1: 14, x2: 180, y2: 178, r2: 11.5, strokeWidth: 7.5 },
  { type: 'rung', x1: 58, y1: 274, r1: 15, x2: 188, y2: 226, r2: 12.5, strokeWidth: 8 },
  { type: 'rung', x1: 60, y1: 334, r1: 14.5, x2: 180, y2: 290, r2: 12, strokeWidth: 7.5 },
  { type: 'rung', x1: 82, y1: 384, r1: 13, x2: 152, y2: 354, r2: 10.5, strokeWidth: 6.5 },

  // Bottom trailing dots
  { type: 'dot', x: 108, y: 424, r: 10.5 },
  { type: 'dot', x: 136, y: 462, r: 11.5 },
  { type: 'dot', x: 152, y: 508, r: 10.5 },
  { type: 'dot', x: 144, y: 554, r: 9 },
]

function StylizedDna({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 590"
      className={`h-full w-full select-none ${className || ''}`}
      fill="currentColor"
    >
      <g className="dna-spiral-group">
        {DNA_ELEMENTS.map((item, idx) => {
          if (item.type === 'dot') {
            return (
              <circle
                key={idx}
                className="dna-node"
                cx={item.x}
                cy={item.y}
                r={item.r}
              />
            )
          }

          return (
            <g key={idx} className="dna-node">
              {/* Connecting Rod */}
              <line
                x1={item.x1}
                y1={item.y1}
                x2={item.x2}
                y2={item.y2}
                stroke="currentColor"
                strokeWidth={item.strokeWidth}
                strokeLinecap="round"
              />
              {/* Left Sphere */}
              <circle cx={item.x1} cy={item.y1} r={item.r1} />
              {/* Right Sphere */}
              <circle cx={item.x2} cy={item.y2} r={item.r2} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function CtaBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const leftDnaRef = useRef<HTMLDivElement>(null)
  const rightDnaRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!containerRef.current || !cardRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      // Clean card reveal
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8 }
      )

      // Animate DNA nodes along the spiral with staggered pop-in
      const leftNodes = leftDnaRef.current?.querySelectorAll('.dna-node')
      const rightNodes = rightDnaRef.current?.querySelectorAll('.dna-node')

      if (leftNodes && leftNodes.length > 0) {
        tl.fromTo(
          Array.from(leftNodes),
          { scale: 0, opacity: 0, transformOrigin: 'center center' },
          { scale: 1, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'back.out(1.6)' },
          '-=0.6'
        )
      }

      if (rightNodes && rightNodes.length > 0) {
        tl.fromTo(
          Array.from(rightNodes),
          { scale: 0, opacity: 0, transformOrigin: 'center center' },
          { scale: 1, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'back.out(1.6)' },
          '-=0.9'
        )
      }

      // Staggered text content reveal
      if (contentRef.current?.children) {
        tl.fromTo(
          Array.from(contentRef.current.children),
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
          '-=0.8'
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={containerRef} 
      className="relative w-full overflow-hidden border-y border-line bg-bg-deep/50 py-20 sm:py-28 lg:py-32"
    >
      {/* Main Full-Width Wrapper */}
      <div
        ref={cardRef}
        className="relative mx-auto w-full px-4 text-center sm:px-6 lg:px-8"
      >
        {/* Left Stylized DNA Helix with Angle - Matched to Theme Accent Color */}
        <div
          ref={leftDnaRef}
          className="pointer-events-none absolute -left-6 -top-16 h-[340px] w-[150px] rotate-[-22deg] text-accent/80 dark:text-accent/90 sm:left-2 sm:-top-12 sm:h-[420px] sm:w-[180px] lg:left-12 lg:-top-8 lg:h-[480px] lg:w-[210px]"
        >
          <StylizedDna />
        </div>

        {/* Right Stylized DNA Helix with Angle - Matched to Theme Accent Color */}
        <div
          ref={rightDnaRef}
          className="pointer-events-none absolute -right-6 -top-16 h-[340px] w-[150px] rotate-[22deg] text-accent/80 dark:text-accent/90 sm:right-2 sm:-top-12 sm:h-[420px] sm:w-[180px] lg:right-12 lg:-top-8 lg:h-[480px] lg:w-[210px]"
        >
          <StylizedDna />
        </div>

        {/* Center Content Section */}
        <div ref={contentRef} className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
          {/* Top Medical Badge Matched to Theme */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3.5 py-1 text-xs font-medium text-accent">
            <Dna className="size-3.5 text-accent" />
            <span>Integrated Clinical Healthcare System</span>
          </div>

          {/* Main Headline */}
          <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            Start your modern <br className="hidden sm:inline" />
            clinical journey today
          </h2>

          {/* Medical Subtext */}
          <p className="max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Connect with board-certified specialists, access electronic prescriptions, and experience unified patient care in one seamless hospital platform.
          </p>

          {/* Action Buttons Matched to Theme Design Tokens */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              ref={buttonRef}
              href="/appointments"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-ink shadow-sm transition-all duration-200 hover:bg-accent-hover hover:scale-[1.02] active:scale-95"
            >
              <Stethoscope className="size-4.5" />
              <span>Schedule a consultation</span>
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/portal"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3.5 text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:bg-surface-strong hover:border-accent/40 hover:text-accent active:scale-95"
            >
              <Activity className="size-4 text-accent" />
              <span>Doctor portal</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
