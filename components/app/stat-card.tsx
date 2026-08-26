import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PulseSpark } from '@/components/brand/pulse-spark'
import { CountUp } from '@/components/motion/count-up'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * The dashboard's unit of information.
 *
 * The sparkline here is the pulse line drawn against real numbers — the motif
 * from the hero doing an actual job rather than decorating one. The change
 * percentage is coloured by direction, but only where direction has a meaning:
 * "up" is good for revenue and patients, and the caller says so.
 */
export function StatCard({
  label,
  value,
  changePct,
  trend,
  icon: Icon,
  prefix,
  suffix,
  invertChange = false,
  footnote,
  className,
}: {
  label: string
  value: number
  changePct?: number
  trend?: number[]
  icon?: LucideIcon
  prefix?: string
  suffix?: string
  /** Set when a rise is bad news — cancellations, outstanding balances. */
  invertChange?: boolean
  footnote?: string
  className?: string
}) {
  const rose = (changePct ?? 0) >= 0
  const good = invertChange ? !rose : rose
  const Arrow = rose ? ArrowUpRight : ArrowDownRight

  return (
    <Card className={cn('flex flex-col gap-3 p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-ink-faint">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0 text-ink-faint" strokeWidth={2} /> : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <CountUp
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular"
        />
        {changePct !== undefined ? (
          <span
            className={cn(
              'flex items-center gap-0.5 font-mono text-xs font-medium',
              good ? 'text-vital-ok' : 'text-vital-crit',
            )}
          >
            <Arrow className="size-3" strokeWidth={2.5} />
            {Math.abs(changePct)}%
          </span>
        ) : null}
      </div>

      {trend && trend.length > 1 ? (
        <PulseSpark
          data={trend}
          className={cn('h-8 w-full', good ? 'text-accent' : 'text-vital-crit')}
        />
      ) : null}

      {footnote ? <p className="text-xs text-ink-faint">{footnote}</p> : null}
    </Card>
  )
}
