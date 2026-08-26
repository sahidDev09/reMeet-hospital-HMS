'use client'

import { useRef } from 'react'
import { gsap } from './gsap'
import { useGsap } from './use-gsap'
import { cn } from '@/lib/utils'

type CountUpProps = {
  value: number
  /** Rendered before the number, e.g. a currency symbol. */
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  delay?: number
  className?: string
  /** Start when scrolled into view rather than on mount. */
  onScroll?: boolean
}

/**
 * Counts a number up to its value.
 *
 * The final value is in the markup from the start, so it's correct for SSR,
 * for screen readers, and under reduced motion — the animation only ever
 * rewrites text content that already reads correctly.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.4,
  delay = 0,
  className,
  onScroll = false,
}: CountUpProps) {
  const out = useRef<HTMLSpanElement>(null)

  const format = (n: number) =>
    `${prefix}${n.toLocaleString('en-BD', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`

  const ref = useGsap<HTMLSpanElement>(
    (el) => {
      const node = out.current
      if (!node) return
      const counter = { n: 0 }

      gsap.to(counter, {
        n: value,
        duration,
        delay,
        ease: 'power2.out',
        onUpdate: () => {
          node.textContent = format(counter.n)
        },
        ...(onScroll
          ? { scrollTrigger: { trigger: el, start: 'top 90%', once: true } }
          : {}),
      })
    },
    [value, duration, delay, onScroll],
  )

  return (
    <span ref={ref} className={cn('tabular', className)}>
      <span ref={out}>{format(value)}</span>
    </span>
  )
}
