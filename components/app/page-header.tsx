import * as React from 'react'
import { PulseLine } from '@/components/brand/pulse-line'
import { cn } from '@/lib/utils'

/**
 * Every module opens the same way: an eyebrow that says where you are, a title,
 * one line of orientation, and the primary action on the right. Consistency here
 * is what lets someone learn nine screens by learning one.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <p className="eyebrow text-accent">{eyebrow}</p> : null}
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-ink-soft">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <PulseLine variant="rule" className="h-3.5 w-full text-line-strong" />
    </div>
  )
}
