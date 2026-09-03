'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser, Session, AuthState } from '@/lib/auth/types'
import type { Role } from '@/lib/data/types'
import { homeFor, isRole } from '@/lib/auth/role-meta'

interface AuthContextValue extends AuthState {
  role: Role
  signInWithRole: (roleKey: 'admin' | 'doctor' | 'staff' | 'patient', redirectTo?: string) => Promise<void>
  signIn: (providerOrEmail: string, password?: string, redirectTo?: string) => Promise<{ error?: string; success?: boolean }>
  signUp: (data: { name: string; email: string; password?: string; role?: Role }, redirectTo?: string) => Promise<{ error?: string; success?: boolean }>
  signOut: (redirectTo?: string) => Promise<void>
  switchRole: (role: Role) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  initialSession = null,
}: {
  children: React.ReactNode
  initialSession?: Session | null
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(!initialSession)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSession(data.session ?? null)
      } else {
        setSession(null)
      }
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const user = session?.user ?? null
  const isAuthenticated = !!user
  const status = loading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated'
  const role: Role = user?.role && isRole(user.role) ? user.role : 'admin'

  const signInWithRole = async (roleKey: 'admin' | 'doctor' | 'staff' | 'patient', redirectTo?: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleKey }),
      })
      const data = await res.json()
      if (data.session) {
        setSession(data.session)
        const target = redirectTo || homeFor(data.session.user.role)
        startTransition(() => {
          router.push(target)
          router.refresh()
        })
      }
    } catch (err) {
      console.error('Role sign in error:', err)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (
    providerOrEmail: string,
    password?: string,
    redirectTo?: string,
  ): Promise<{ error?: string; success?: boolean }> => {
    setLoading(true)
    try {
      // OAuth Provider Login initiation
      if (providerOrEmail === 'google' || providerOrEmail === 'github') {
        const res = await fetch(`/api/auth/oauth?provider=${providerOrEmail}`, { method: 'POST' })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
          return { success: true }
        }
        if (data.session) {
          setSession(data.session)
          const target = redirectTo || homeFor(data.session.user.role)
          startTransition(() => {
            router.push(target)
            router.refresh()
          })
          return { success: true }
        }
        return { error: data.error || 'Failed to authenticate via OAuth' }
      }

      // Credentials Login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: providerOrEmail, password }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        return { error: data.error || 'Invalid credentials' }
      }

      if (data.session) {
        setSession(data.session)
        const target = redirectTo || homeFor(data.session.user.role)
        startTransition(() => {
          router.push(target)
          router.refresh()
        })
        return { success: true }
      }

      return { error: 'Login failed' }
    } catch (err: unknown) {
      const errorObj = err as Error
      return { error: errorObj.message || 'An error occurred during sign in.' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    data: { name: string; email: string; password?: string; role?: Role },
    redirectTo?: string,
  ): Promise<{ error?: string; success?: boolean }> => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const resData = await res.json()
      if (!res.ok || resData.error) {
        return { error: resData.error || 'Registration failed' }
      }

      if (resData.session) {
        setSession(resData.session)
        const target = redirectTo || '/?onboarding=true'
        startTransition(() => {
          router.push(target)
          router.refresh()
        })
        return { success: true }
      }

      return { error: 'Registration failed' }
    } catch (err: unknown) {
      const errorObj = err as Error
      return { error: errorObj.message || 'An error occurred during registration.' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (redirectTo = '/sign-in') => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setSession(null)
      localStorage.removeItem('remeet_onboarded')
      startTransition(() => {
        router.push(redirectTo)
        router.refresh()
      })
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setLoading(false)
    }
  }

  const switchRole = async (nextRole: Role) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const data = await res.json()
      if (data.session) {
        setSession(data.session)
        startTransition(() => {
          router.push(homeFor(nextRole))
          router.refresh()
        })
      }
    } catch (err) {
      console.error('Switch role error:', err)
    }
  }

  const refreshSession = async () => {
    await fetchSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        status,
        isLoading: loading,
        isAuthenticated,
        role,
        signInWithRole,
        signIn,
        signUp,
        signOut,
        switchRole,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Compatible helper for components transitioning from Clerk's useUser().
 */
export function useUser() {
  const { user, isLoading, isAuthenticated } = useAuth()
  return {
    isLoaded: !isLoading,
    isSignedIn: isAuthenticated,
    user: user
      ? {
          id: user.id,
          fullName: user.name,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' '),
          imageUrl: user.image || '/images/doctors/doc_01.jpg',
          primaryEmailAddress: { emailAddress: user.email },
          emailAddresses: [{ emailAddress: user.email }],
          role: user.role,
        }
      : null,
  }
}
