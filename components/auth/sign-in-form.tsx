'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Stethoscope,
  Building2,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'

export function SignInForm() {
  const { signIn, signInWithRole, isLoading } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState('')
  const [pendingProvider, setPendingProvider] = React.useState<string | null>(null)

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setError('')
    setPendingProvider('credentials')

    const res = await signIn(email, password)
    if (res?.error) {
      setError(res.error)
    }
    setPendingProvider(null)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('')
    setPendingProvider(provider)
    const res = await signIn(provider)
    if (res?.error) {
      setError(res.error)
    }
    setPendingProvider(null)
  }

  const handleDemoLogin = async (roleKey: 'admin' | 'doctor' | 'staff' | 'patient') => {
    setError('')
    setPendingProvider(`demo-${roleKey}`)
    await signInWithRole(roleKey)
    setPendingProvider(null)
  }

  return (
    <div className="flex w-full flex-col gap-5">
      {/* Title */}
      <div className="flex flex-col gap-1 text-left">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Sign in to reMeet</h2>
        <p className="text-xs text-ink-soft">Enter your clinical credentials or use OAuth to access your workspace.</p>
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
          disabled={!!pendingProvider || isLoading}
          className="flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-sm transition-all hover:border-line-strong hover:bg-surface-strong active:scale-95 disabled:opacity-50"
        >
          {pendingProvider === 'google' ? (
            <Loader2 className="size-4 animate-spin text-accent" />
          ) : (
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
          )}
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={!!pendingProvider || isLoading}
          className="flex h-10 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-sm transition-all hover:border-line-strong hover:bg-surface-strong active:scale-95 disabled:opacity-50"
        >
          {pendingProvider === 'github' ? (
            <Loader2 className="size-4 animate-spin text-accent" />
          ) : (
            <svg className="size-4 fill-current text-ink" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span>GitHub</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-line" />
        <span className="absolute bg-surface px-2 text-[0.6875rem] uppercase tracking-wider text-ink-faint">
          or continue with email
        </span>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-3.5 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink">Email address</label>
          <input
            type="email"
            required
            placeholder="dr.eleanor@remeet.health"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-xl border border-line bg-bg px-3 text-xs text-ink outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-ink">Password</label>
            <span className="text-[0.6875rem] text-ink-faint">Admin default: remeet2026</span>
          </div>
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

        <Button
          type="submit"
          size="lg"
          disabled={pendingProvider === 'credentials' || isLoading}
          className="mt-1 w-full gap-2"
        >
          {pendingProvider === 'credentials' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in to workspace
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      {/* 1-Click Quick Demo Sign In */}
      <div className="rounded-2xl border border-line bg-surface-strong/60 p-3 text-left">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-faint">
            ⚡ Quick Demo Logins
          </span>
          <span className="text-[0.625rem] text-accent">1-click access</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            disabled={!!pendingProvider}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface p-2 text-left text-xs transition-all hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <ShieldCheck className="size-3.5 text-accent shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink truncate">Administrator</span>
              <span className="text-[0.625rem] text-ink-faint truncate">Full system control</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('doctor')}
            disabled={!!pendingProvider}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface p-2 text-left text-xs transition-all hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <Stethoscope className="size-3.5 text-indigo-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink truncate">Doctor</span>
              <span className="text-[0.625rem] text-ink-faint truncate">Dr. Eleanor Vance</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('staff')}
            disabled={!!pendingProvider}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface p-2 text-left text-xs transition-all hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <Building2 className="size-3.5 text-teal-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink truncate">Front Desk</span>
              <span className="text-[0.625rem] text-ink-faint truncate">Triage & Reception</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('patient')}
            disabled={!!pendingProvider}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface p-2 text-left text-xs transition-all hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <User className="size-3.5 text-amber-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink truncate">Patient</span>
              <span className="text-[0.625rem] text-ink-faint truncate">Michael Ross</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="flex flex-col gap-2 border-t border-line pt-3 text-center text-xs text-ink-soft">
        <div>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </div>
        <div className="flex items-center justify-center gap-4 text-[0.6875rem] text-ink-faint">
          <Link href="/admin-login" className="hover:text-ink flex items-center gap-1">
            <ShieldCheck className="size-3" /> Admin 2FA Login
          </Link>
          <span>&bull;</span>
          <Link href="/doctor-otp" className="hover:text-ink flex items-center gap-1">
            <KeyRound className="size-3" /> Doctor OTP Login
          </Link>
        </div>
      </div>
    </div>
  )
}
