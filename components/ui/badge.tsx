import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Status pill.
 *
 * The vital-* tones map to clinical meaning and are used consistently across
 * the app: ok = in stock / paid / completed, warn = expiring / pending,
 * crit = expired / overdue / cancelled.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em]',
  {
    variants: {
      tone: {
        neutral: 'bg-ink/[0.06] text-ink-soft dark:bg-white/[0.08]',
        accent: 'bg-accent-soft text-accent',
        ok: 'bg-vital-ok/12 text-vital-ok',
        warn: 'bg-vital-warn/15 text-vital-warn',
        crit: 'bg-vital-crit/12 text-vital-crit',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

function Badge({
  className,
  tone,
  dot = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {props.children}
    </span>
  )
}

export { Badge, badgeVariants }
