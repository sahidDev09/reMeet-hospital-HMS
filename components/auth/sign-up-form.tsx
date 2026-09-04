'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ShieldCheck,
  Stethoscope,
  Building2,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import type { Role } from '@/lib/data/types'
import { cn } from '@/lib/utils'

export function SignUpForm() {
  const { signUp, signIn, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || searchParams.get('callbackUrl') || undefined

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<Role>('staff')
  const [error, setError] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      setError('Please provide your name and email.')
      return
    }
    setError('')
    setSubmitting(true)

    const res = await signUp(
      {
        name,
        email,
        password,
        role: selectedRole,
      },
      redirectTarget
    )

    if (res?.error) {
      setError(res.error)
    }
    setSubmitting(false)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('')
    setSubmitting(true)
    const res = await signIn(provider, undefined, redirectTarget)
    if (res?.error) {
      setError(res.error)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Create an account</h2>
        <p className="text-xs text-ink-soft">Join reMeet Healthcare Network and set up your profile.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={submitting || isLoading}
          className="flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-sm transition-all hover:border-line-strong hover:bg-surface-strong active:scale-95 disabled:opacity-50"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={submitting || isLoading}
          className="flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-sm transition-all hover:border-line-strong hover:bg-surface-strong active:scale-95 disabled:opacity-50"
        >
          <svg className="size-4 fill-current text-ink" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-surface px-2 text-[0.6875rem] uppercase tracking-wider text-ink-faint">
          or register with email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Full name</label>
          <input
            type="text"
            required
            placeholder="Dr. Alexander Wright"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Email address</label>
          <input
            type="email"
            required
            placeholder="alexander@remeet.health"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Create password</label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-bg pl-3 pr-10 text-xs text-ink outline-none transition-colors focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-ink-faint hover:text-ink cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Role Type Selection */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-xs font-medium text-ink">Initial role type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('staff')}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                selectedRole === 'staff'
                  ? 'border-accent bg-accent/10 ring-1 ring-accent text-ink font-semibold'
                  : 'border-line bg-bg text-ink-soft hover:border-accent/40',
              )}
            >
              <Building2 className="size-4 mb-1 text-teal-500" />
              <span className="text-[0.6875rem]">Front Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('doctor')}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                selectedRole === 'doctor'
                  ? 'border-accent bg-accent/10 ring-1 ring-accent text-ink font-semibold'
                  : 'border-line bg-bg text-ink-soft hover:border-accent/40',
              )}
            >
              <Stethoscope className="size-4 mb-1 text-indigo-500" />
              <span className="text-[0.6875rem]">Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('patient')}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer',
                selectedRole === 'patient'
                  ? 'border-accent bg-accent/10 ring-1 ring-accent text-ink font-semibold'
                  : 'border-line bg-bg text-ink-soft hover:border-accent/40',
              )}
            >
              <User className="size-4 mb-1 text-amber-500" />
              <span className="text-[0.6875rem]">Patient</span>
            </button>
          </div>
          {selectedRole === 'doctor' && (
            <p className="text-[0.625rem] text-amber-500 flex items-center gap-1">
              <ShieldCheck className="size-3 shrink-0" />
              Doctors require admin verification or OTP approval.
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting || isLoading}
          className="mt-2 w-full gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Links */}
      <div className="flex flex-col gap-2 border-t border-line pt-3 text-center text-xs text-ink-soft">
        <div>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
