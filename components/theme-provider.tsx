'use client'

import { ThemeProvider as NextThemes } from 'next-themes'
import * as React from 'react'

/**
 * Class-based theming so the `.dark` variant in globals.css applies. Transitions
 * are disabled during the switch — otherwise every colour on the page eases at
 * once and the change reads as a glitch rather than a toggle.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  )
}
