import Link from 'next/link'
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react'
import { Wordmark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12 text-center">
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-6">
        <Link href="/" className="mb-2">
          <Wordmark className="text-xl" />
        </Link>

        <div className="glass flex w-full flex-col items-center rounded-3xl p-8 shadow-glass">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Error 404
          </span>

          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Record Not Found
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            The page, patient record, or clinical resource you were looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button asChild variant="primary" size="md">
              <Link href="/dashboard" className="gap-2">
                <LayoutDashboard className="size-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="glass" size="md">
              <Link href="/" className="gap-2">
                <Home className="size-4" />
                Home Page
              </Link>
            </Button>
          </div>
        </div>

        <p className="font-mono text-[0.6875rem] text-ink-faint">
          reMeet Hospital Management System
        </p>
      </div>
    </main>
  )
}
