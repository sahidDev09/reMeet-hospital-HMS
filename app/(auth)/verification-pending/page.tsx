'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Stethoscope,
  Building2,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/app/theme-toggle'
import { useAuth } from '@/lib/auth/context'
import { verifyDoctorOtp } from '@/lib/data/verifications'

export default function VerificationPendingPage() {
  const router = useRouter()
  const { user, signOut, role } = useAuth()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email || !otp) {
      setError('Please enter the 6-digit OTP code sent to your email.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await verifyDoctorOtp(user.email, otp)
      if (res.success) {
        setSuccess(res.message)
        setTimeout(() => {
          if (role === 'doctor') {
            router.push('/portal')
          } else {
            router.push('/dashboard')
          }
        }, 1200)
      } else {
        setError(res.message)
      }
    } catch (err: unknown) {
      const errorObj = err as Error
      setError(errorObj.message || 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = role === 'doctor' ? 'Doctor' : 'Front Desk Staff'

  return (
    <div className="flex min-h-dvh flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <Link href="/" className="inline-flex items-center">
          <Wordmark className="text-xl" />
        </Link>
        <ThemeToggle />
      </header>

      <div className="my-auto py-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl">
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/10">
              <ShieldAlert className="size-7" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Administrator Verification Required
            </h1>
            <p className="text-xs text-ink-soft max-w-sm">
              All clinical doctors and front desk personnel require administrator approval before accessing hospital records.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-strong/50 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">{user?.name || 'Practitioner'}</p>
                <p className="text-[0.6875rem] text-ink-soft">{user?.email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[0.6875rem] font-medium text-amber-600 dark:text-amber-400">
              {role === 'doctor' ? <Stethoscope className="size-3" /> : <Building2 className="size-3" />}
              {roleLabel} · Pending
            </span>
          </div>

          {/* Workflow Steps Card */}
          <div className="rounded-xl border border-line bg-bg p-4 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Clock className="size-3.5 text-accent" />
              Verification In Progress
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Your registration has been submitted to the Hospital Administration team. Once reviewed, the administrator will approve your profile and dispatch an activation OTP to your email.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* OTP Verification Form */}
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 pt-1 border-t border-line">
            <label className="text-xs font-medium text-ink flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-accent" />
              Received your approval OTP?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-line bg-bg px-3 font-mono text-center text-sm font-semibold tracking-widest text-ink outline-none transition-colors focus:border-accent"
              />
              <Button type="submit" disabled={loading || !otp} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                Verify & Enter
              </Button>
            </div>
          </form>

          {/* Admin Demo Helper Note */}
          <div className="rounded-xl border border-accent/20 bg-accent-soft/30 p-3.5 text-center">
            <p className="text-[0.6875rem] text-ink-soft">
              <strong className="text-accent">Admin Demo Tip:</strong> Log in as{' '}
              <span className="font-mono font-semibold text-ink">admin@remeet.health</span> (Password:{' '}
              <span className="font-mono text-ink">remeet2026</span>) to approve this account from the{' '}
              <Link href="/admin/verifications" className="text-accent underline font-medium">
                Approvals Dashboard
              </Link>
              .
            </p>
          </div>

          {/* Sign Out Action */}
          <div className="flex items-center justify-between border-t border-line pt-4">
            <Link href="/" className="text-xs text-ink-soft hover:text-ink transition-colors">
              &larr; Back to Landing Page
            </Link>
            <button
              type="button"
              onClick={() => signOut('/')}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-center text-center text-xs text-ink-faint">
        reMeet Hospital Operating System &middot; Access Control &amp; Clinical Governance
      </footer>
    </div>
  )
}
