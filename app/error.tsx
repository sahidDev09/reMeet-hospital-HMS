'use client'

import * as React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log exception for telemetry if needed
    console.error('Unhandled clinical application error:', error)
  }, [error])

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12 text-center">
      <div className="glass mx-auto flex w-full max-w-lg flex-col items-center rounded-3xl p-8 shadow-lift border border-vital-crit/20">
        <div className="grid size-14 place-items-center rounded-2xl bg-vital-crit/10 text-vital-crit">
          <AlertTriangle className="size-7 stroke-[2.2]" />
        </div>

        <span className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-vital-crit">
          Application Exception
        </span>

        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          An unexpected error occurred while processing this clinical view. Your records remain safe.
        </p>

        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-faint">
            Reference code: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="primary" size="md" className="gap-2">
            <RefreshCw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="outline" size="md">
            <Link href="/" className="gap-2">
              <Home className="size-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
