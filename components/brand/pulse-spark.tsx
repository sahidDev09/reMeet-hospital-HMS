'use client'

import { PulseLine } from '@/components/brand/pulse-line'
import { gsap } from '@/components/motion/gsap'
import { useGsap } from '@/components/motion/use-gsap'
import { cn } from '@/lib/utils'

/**
 * A sparkline that draws itself when it scrolls into view.
 *
 * The tween runs `fromTo`, starting at hidden and ending at the state already in
 * the markup — so the line is present before, during, and after, and reduced
 * motion just skips the drawing.
 */
export function PulseSpark({
  data,
  className,
  delay = 0,
}: {
  data: number[]
  className?: string
  delay?: number
}) {
  const scope = useGsap<HTMLSpanElement>(
    (el) => {
      const path = el.querySelector<SVGPathElement>('[data-pulse]')
      if (!path) return
      const length = Number(path.dataset.length ?? 0)

      gsap.fromTo(
        path,
        { strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          duration: 1.1,
          delay,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        },
      )
    },
    [data.join(','), delay],
  )

  return (
    <span ref={scope} className={cn('block', className)}>
      <PulseLine variant="spark" data={data} draw className="h-full w-full" />
    </span>
  )
}
