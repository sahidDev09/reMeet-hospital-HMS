'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { createVerificationRequest } from '@/lib/data/verifications'

export default function StaffVerificationPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [designation, setDesignation] = useState('Front Desk Coordinator')
  const [idNumber, setIdNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !designation || !idNumber || !email) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await createVerificationRequest({
        fullName,
        designation,
        idNumber,
        email,
        role: 'staff',
      })

      setSubmitted(true)
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col justify-between p-4 sm:p-6 lg:p-8">
        <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Wordmark className="text-xl" />
          </Link>
          <ThemeToggle />
        </header>
        <div className="my-auto py-8">
          <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-line bg-surface p-8 text-center shadow-xl">
            <div className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="size-8" />
            </div>

            <Wordmark className="text-xl" />

            <div className="flex flex-col gap-3">
              <h2 className="font-display text-2xl font-semibold text-ink">Front Desk Verification Submitted</h2>
              <p className="text-sm leading-relaxed text-ink-soft bg-accent-soft/40 p-4 rounded-xl border border-accent/20">
                &ldquo;Your front desk credentials have been submitted for administrator review. Once verified, you will receive an approval notification and access will be granted to the Hospital Desk.&rdquo;
              </p>
            </div>

            <div className="flex flex-col w-full gap-3 pt-2">
              <Button asChild size="lg" className="w-full gap-2">
                <Link href="/verification-pending">
                  Check Verification Status
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Back to Landing Page</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <Link href="/" className="inline-flex items-center">
          <Wordmark className="text-xl" />
        </Link>
        <ThemeToggle />
      </header>

      <div className="my-auto py-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="grid size-12 place-items-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Building2 className="size-6" />
            </div>
            <Wordmark className="text-xl" />
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Front Desk Staff Verification
            </h1>
            <p className="text-xs text-ink-soft max-w-sm">
              All front desk staff must be verified by the hospital administrator before accessing patient reception and billing.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-500 border border-rose-500/20">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink">Full Legal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink">Role / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="Lead Reception Coordinator"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink">Staff Employee ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DESK-8421"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink">Official Email Address</label>
              <input
                type="email"
                required
                placeholder="staff@remeet.health"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full gap-2">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting Verification...
                </>
              ) : (
                <>
                  Submit to Administrator
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-ink-soft">
            <Link href="/" className="hover:text-ink transition-colors">
              &larr; Return to Landing Page
            </Link>
          </div>
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-center text-center text-xs text-ink-faint">
        reMeet Hospital Operating System &middot; Front Desk Verification &amp; Compliance
      </footer>
    </div>
  )
}
