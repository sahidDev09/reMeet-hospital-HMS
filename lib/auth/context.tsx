'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  SessionProvider as NextAuthSessionProvider,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from 'next-auth/react'
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

function AuthInternalProvider({
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
        if (data?.user) {
          setSession({
            user: {
              id: (data.user as any).id || 'usr_' + (data.user.email ? data.user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'user'),
              name: data.user.name || 'User',
              email: data.user.email || '',
              role: ((data.user as any).role as Role) || 'staff',
              provider: 'next-auth',
              image: data.user.image || '/images/doctors/doc_02.jpg',
              designation: (data.user as any).designation,
              department: (data.user as any).department,
            },
            createdAt: Date.now(),
            expiresAt: data.expires ? new Date(data.expires).getTime() : Date.now() + 30 * 86400000,
          })
        } else if (data?.session) {
          setSession(data.session)
        } else {
          setSession(null)
        }
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
  const role: Role = user?.role && isRole(user.role) ? user.role : 'staff'

  const signInWithRole = async (roleKey: 'admin' | 'doctor' | 'staff' | 'patient', redirectTo?: string) => {
    setLoading(true)
    try {
      const res = await nextAuthSignIn('credentials', {
        role: roleKey,
        isDemo: 'true',
        redirect: false,
      })

      if (res?.ok) {
        await fetchSession()
        const target = redirectTo || homeFor(roleKey)
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
      // 1. NextAuth OAuth (Google / GitHub)
      if (providerOrEmail === 'google' || providerOrEmail === 'github') {
        const target = redirectTo || '/dashboard'
        await nextAuthSignIn(providerOrEmail, {
          callbackUrl: target,
        })
        return { success: true }
      }

      // 2. NextAuth Credentials Login
      const res = await nextAuthSignIn('credentials', {
        email: providerOrEmail,
        password,
        redirect: false,
      })

      if (res?.error) {
        return { error: res.error || 'Invalid credentials' }
      }

      if (res?.ok) {
        await fetchSession()
        const target = redirectTo || '/dashboard'
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

      // Automatically sign in with credentials after registration
      if (data.password) {
        await nextAuthSignIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        })
      }

      await fetchSession()
      const target = redirectTo || '/?onboarding=true'
      startTransition(() => {
        router.push(target)
        router.refresh()
      })
      return { success: true }
    } catch (err: unknown) {
      const errorObj = err as Error
      return { error: errorObj.message || 'An error occurred during registration.' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (redirectTo = '/') => {
    setLoading(true)
    try {
      // 1. Invalidate server session & delete cookies
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}

      // 2. Clear client storage & cookies
      try {
        const clientCookies = [
          'remeet_token',
          'remeet_jwt',
          'remeet_role',
          'next-auth.session-token',
          '__Secure-next-auth.session-token',
          'next-auth.csrf-token',
          'next-auth.callback-url',
        ]
        for (const name of clientCookies) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
        localStorage.clear()
        sessionStorage.clear()
      } catch {}

      setSession(null)

      // 3. Clear NextAuth session
      try {
        await nextAuthSignOut({
          redirect: false,
        })
      } catch {}

      // 4. Force browser immediately to the landing page, quitting the dashboard
      window.location.href = redirectTo
    } catch (err) {
      console.error('Sign out error:', err)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  const switchRole = async (nextRole: Role) => {
    // Patients cannot access any other role
    if (role === 'patient') {
      console.warn('Patients are not permitted to switch roles.')
      return
    }

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

export function AuthProvider({
  children,
  initialSession = null,
}: {
  children: React.ReactNode
  initialSession?: Session | null
}) {
  return (
    <NextAuthSessionProvider>
      <AuthInternalProvider initialSession={initialSession}>
        {children}
      </AuthInternalProvider>
    </NextAuthSessionProvider>
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
