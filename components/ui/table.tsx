import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Semantic table primitives. Real <table> markup rather than a grid of divs,
 * so screen readers get row/column relationships and the print stylesheet can
 * keep rows from splitting across pages.
 */

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full border-collapse text-left text-sm', className)}
        {...props}
      />
    </div>
  )
}

function THead({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-head" className={cn(className)} {...props} />
}

function TBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TR({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('border-b border-line last:border-0', className)}
      {...props}
    />
  )
}

function TH({ className, numeric, ...props }: React.ComponentProps<'th'> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      data-slot="table-column-header"
      className={cn(
        'whitespace-nowrap px-4 py-2.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-ink-faint',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  )
}

function TD({ className, numeric, ...props }: React.ComponentProps<'td'> & { numeric?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn('px-4 py-3 align-middle text-ink', numeric && 'text-right tabular', className)}
      {...props}
    />
  )
}

/** Hover affordance for rows that navigate somewhere. */
const rowInteractive =
  'cursor-pointer transition-colors hover:bg-accent-soft focus-within:bg-accent-soft'

export { Table, THead, TBody, TR, TH, TD, rowInteractive }
