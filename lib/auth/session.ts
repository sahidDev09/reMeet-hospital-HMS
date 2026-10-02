import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AuthUser, Session } from '@/lib/auth/types'
import type { Role } from '@/lib/data/types'
import { ROLE_COOKIE } from '@/lib/auth/role-meta'
import {
  signJWT,
  verifyJWT,
  JWT_COOKIE_NAME,
  JWT_MAX_AGE_SECONDS,
} from '@/lib/auth/jwt'

export const SESSION_COOKIE = JWT_COOKIE_NAME
export const SESSION_MAX_AGE = JWT_MAX_AGE_SECONDS

/**
 * Pre-configured accounts for instant access and demo environments.
 */
export const DEMO_ADMIN_TOKEN = 'REMEET-ADMIN-TOKEN-2026'

export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  admin: {
    id: 'usr_admin_01',
    name: 'Hospital Administrator',
    email: 'admin@remeet.health',
    role: 'admin',
    provider: 'demo',
    image: '/images/doctors/doc_02.jpg',
    designation: 'Chief Medical Director',
    department: 'Hospital Administration',
  },
  adminWork: {
    id: 'usr_admin_02',
    name: 'Hospital Administrator',
    email: 'iambotforwork72@gmail.com',
    role: 'admin',
    provider: 'demo',
    image: '/images/doctors/doc_02.jpg',
    designation: 'Chief Medical Director',
    department: 'Hospital Administration',
  },
  doctor: {
    id: 'doc_01',
    name: 'Dr. Eleanor Vance',
    email: 'dr.eleanor@remeet.health',
    role: 'doctor',
    provider: 'demo',
    image: '/images/doctors/doc_01.jpg',
    designation: 'Senior Cardiologist',
    department: 'Cardiology',
  },
  staff: {
    id: 'usr_staff_01',
    name: 'Sarah Jenkins',
    email: 'staff@remeet.health',
    role: 'staff',
    provider: 'demo',
    image: '/images/doctors/doc_03.jpg',
    designation: 'Lead Reception Coordinator',
    department: 'Front Desk & Triage',
  },
  patient: {
    id: 'usr_patient_01',
    name: 'Michael Ross',
    email: 'patient@remeet.health',
    role: 'patient',
    provider: 'demo',
    image: '/images/doctors/doc_04.jpg',
    designation: 'Verified Patient',
    department: 'Outpatient Care',
  },
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

/**
 * Returns the currently active verified session from NextAuth or HTTP cookies using JWT.
 * Returns null if no valid session is present.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const nextAuthSession = await getServerSession(authOptions)
    if (nextAuthSession?.user) {
      const u = nextAuthSession.user as any
      return {
        user: {
          id: u.id || 'usr_' + (u.email ? u.email.replace(/[^a-zA-Z0-9]/g, '_') : 'oauth'),
          name: u.name || 'User',
          email: u.email || '',
          role: (u.role as Role) || 'staff',
          provider: 'next-auth',
          image: u.image || '/images/doctors/doc_02.jpg',
          designation: u.designation,
          department: u.department,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + JWT_MAX_AGE_SECONDS * 1000,
      }
    }
  } catch (err) {
    // Context where getServerSession isn't available
  }

  const jar = await cookies()
  const token = jar.get(JWT_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const user = await verifyJWT(token)
  if (!user) {
    return null
  }

  return {
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + JWT_MAX_AGE_SECONDS * 1000,
  }
}

/**
 * Returns the authenticated user or null.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Next.js server-side auth helper.
 */
export async function auth() {
  const session = await getSession()
  const user = session?.user ?? null

  return {
    userId: user?.id ?? null,
    user,
    session,
    isAuthenticated: !!user,
    protect: async (redirectTo = '/sign-in') => {
      if (!user) {
        redirect(redirectTo)
      }
      return user
    },
  }
}

import type { NextResponse } from 'next/server'

/**
 * Creates and sets a new JWT session cookie.
 */
export async function createSession(user: AuthUser, response?: NextResponse): Promise<Session> {
  const token = await signJWT(user)

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  }

  const roleCookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  }

  try {
    const jar = await cookies()
    jar.set(JWT_COOKIE_NAME, token, cookieOptions)
    jar.set(ROLE_COOKIE, user.role, roleCookieOptions)
  } catch {
    // cookies() might be immutable in some contexts
  }

  if (response) {
    response.cookies.set(JWT_COOKIE_NAME, token, cookieOptions)
    response.cookies.set(ROLE_COOKIE, user.role, roleCookieOptions)
  }

  return {
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + JWT_MAX_AGE_SECONDS * 1000,
  }
}

/**
 * Updates the user's role in the active session and re-issues a signed JWT.
 */
export async function updateSessionRole(role: Role, response?: NextResponse): Promise<Session | null> {
  const user = await getCurrentUser()
  if (!user) return null

  user.role = role
  const token = await signJWT(user)

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  }

  const roleCookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  }

  try {
    const jar = await cookies()
    jar.set(JWT_COOKIE_NAME, token, cookieOptions)
    jar.set(ROLE_COOKIE, role, roleCookieOptions)
  } catch {}

  if (response) {
    response.cookies.set(JWT_COOKIE_NAME, token, cookieOptions)
    response.cookies.set(ROLE_COOKIE, role, roleCookieOptions)
  }

  return {
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + JWT_MAX_AGE_SECONDS * 1000,
  }
}

/**
 * Clears all session cookies and signs the user out completely.
 */
export async function destroySession(response?: NextResponse): Promise<void> {
  const cookieNames = [
    JWT_COOKIE_NAME,
    'remeet_token',
    'remeet_jwt',
    ROLE_COOKIE,
    'remeet_role',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    'next-auth.pkce.code_verifier',
  ]

  try {
    const jar = await cookies()
    const all = jar.getAll()
    for (const c of all) {
      if (c.name.startsWith('next-auth') || c.name.startsWith('__Secure-next-auth') || c.name.startsWith('remeet_')) {
        cookieNames.push(c.name)
      }
    }
    const unique = Array.from(new Set(cookieNames))
    for (const name of unique) {
      jar.delete(name)
    }
  } catch {}

  if (response) {
    const unique = Array.from(new Set(cookieNames))
    for (const name of unique) {
      response.cookies.delete(name)
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        expires: new Date(0),
      })
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        expires: new Date(0),
      })
    }
  }
}
