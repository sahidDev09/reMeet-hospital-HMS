'use client'

import type { ReactNode } from 'react'
import { gsap } from './gsap'
import { useGsap } from './use-gsap'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Stagger direct children marked `data-reveal` instead of the wrapper as one block. */
  stagger?: boolean
  delay?: number
  y?: number
}

/**
 * Scroll-triggered rise-and-fade. Fires once, on the way down only.
 *
 * `gsap.from` means the start state is applied by JS, so if scripts fail the
 * content simply renders in place rather than staying invisible.
 */
export function Reveal({ children, className, stagger = false, delay = 0, y = 22 }: RevealProps) {
  const ref = useGsap<HTMLDivElement>(
    (el) => {
      const items = stagger
        ? Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
        : [el]
      if (items.length === 0) return

      gsap.from(items, {
        opacity: 0,
        y,
        duration: 0.75,
        ease: 'power3.out',
        delay,
        stagger: stagger ? 0.07 : 0,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    },
    [stagger, delay, y],
  )

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  )
}
