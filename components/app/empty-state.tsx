import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * An empty screen is an invitation, so the copy names the next action instead of
 * reporting an absence. Callers pass the action itself.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
      ) : null}
      <p className="font-display text-base font-medium text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
