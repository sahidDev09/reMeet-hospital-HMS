'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Printing goes through the browser rather than a PDF library.
 *
 * The PRD called for jsPDF; native print is the better tool here. The output is
 * real vector text — selectable, searchable, correctly sized to A5 by the @page
 * rule in globals.css — at zero bundle cost, and it picks up the same stylesheet
 * as the screen so the sheet can't drift from what was reviewed. When the backend
 * needs PDF *bytes* (emailing a prescription), that's a server-side renderer, not
 * a client library.
 */
export function PrintButton({
  label = 'Print',
  variant = 'primary',
}: {
  label?: string
  variant?: 'primary' | 'outline' | 'glass'
}) {
  return (
    <Button variant={variant} onClick={() => window.print()} data-print="hide">
      <Printer className="size-4" />
      {label}
    </Button>
  )
}
