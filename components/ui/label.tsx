import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'text-[0.8125rem] font-medium text-ink-soft select-none peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Label + control + hint, so forms stay consistently spaced and always labelled.
 *
 * `error` takes the hint's place rather than stacking below it — two lines of
 * small print under one input is how people end up reading the wrong one.
 */
function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-vital-crit">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
}

export { Label, Field }
