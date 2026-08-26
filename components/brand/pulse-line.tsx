import { cn } from '@/lib/utils'
import { approxLength, ecgPath, rulePath, sparkPath } from '@/lib/ecg'

type Common = {
  className?: string
  /** Stroke colour. Defaults to `currentColor`, so `text-*` classes drive it. */
  color?: string
  strokeWidth?: number
  /**
   * Marks the path for a draw-on animation: it gets `data-pulse` and a
   * `data-length` the animator reads, plus a dash pattern.
   *
   * Note what this deliberately does *not* do — it never sets an initial
   * `strokeDashoffset`. The path always renders fully drawn, and the animator
   * tweens *from* hidden with `gsap.fromTo`. So if JavaScript is slow, blocked,
   * or reduced motion is on, the line is simply there rather than invisible.
   */
  draw?: boolean
}

type PulseLineProps = Common &
  (
    | { variant: 'hero'; beats?: number; data?: never }
    | { variant: 'rule'; beats?: never; data?: never }
    | { variant: 'spark'; data: number[]; beats?: never }
  )

const BOX = {
  hero: { w: 1200, h: 160 },
  rule: { w: 1200, h: 24 },
  spark: { w: 120, h: 36 },
} as const

/**
 * reMeet's signature motif.
 *
 * `hero`  — the full cardiac trace that draws itself across the landing hero.
 * `rule`  — a flat divider with one beat at its midpoint.
 * `spark` — the same trace shape driven by real data, for stat cards.
 */
export function PulseLine({
  variant,
  data,
  beats = 3,
  color = 'currentColor',
  strokeWidth,
  draw = false,
  className,
}: PulseLineProps) {
  const { w, h } = BOX[variant]

  const d =
    variant === 'hero'
      ? ecgPath(w, h, beats)
      : variant === 'rule'
        ? rulePath(w, h)
        : sparkPath(data ?? [], w, h)

  const width = strokeWidth ?? (variant === 'hero' ? 2.5 : variant === 'spark' ? 2 : 1.5)
  const len = approxLength(w, h)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      // The trace is decorative in hero/rule form; as a sparkline the number
      // beside it already carries the value, so it stays hidden either way.
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio={variant === 'spark' ? 'none' : 'xMidYMid meet'}
      className={cn('overflow-visible text-accent', className)}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        {...(draw ? { 'data-pulse': '', 'data-length': len, strokeDasharray: len } : {})}
      />
    </svg>
  )
}
