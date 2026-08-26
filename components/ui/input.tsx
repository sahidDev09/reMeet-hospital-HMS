import * as React from 'react'
import { cn } from '@/lib/utils'

const fieldBase =
  'w-full rounded-lg border border-line bg-surface-solid/60 px-3 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong focus:border-accent focus:bg-surface-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50'

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldBase, 'h-10', type === 'number' && 'tabular', className)}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'min-h-20 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  )
}

/** Native select — lighter than a Radix popover for short, well-known option lists. */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(fieldBase, 'h-10 cursor-pointer appearance-none pr-9', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A91A8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.65rem center',
      }}
      {...props}
    />
  )
}

export { Input, Textarea, NativeSelect, fieldBase }
