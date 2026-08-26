import { cn } from '@/lib/utils'

/**
 * The reMeet mark: two overlapping rounded forms reading as a connection —
 * "re-meet". The gap between them is the point, so it stays open at all sizes.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-7', className)}>
      <circle
        cx="12"
        cy="16"
        r="7.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="34 12"
        transform="rotate(-45 12 16)"
      />
      <circle
        cx="20"
        cy="16"
        r="7.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="34 12"
        transform="rotate(135 20 16)"
      />
    </svg>
  )
}

export function Wordmark({
  className,
  subtitle,
}: {
  className?: string
  subtitle?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Logo className="size-7 shrink-0 text-accent" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.04em] text-ink">
          re<span className="text-accent">Meet</span>
        </span>
        {subtitle ? (
          <span className="mt-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-faint">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )
}
