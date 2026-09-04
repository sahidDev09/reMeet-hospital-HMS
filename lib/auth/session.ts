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
export const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  admin: {
    id: 'usr_admin_01',
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
    role: 'staff',
    provider: 'demo',
    image: '/images/doctors/doc_04.jpg',
    designation: 'Verified Patient',
    department: 'Outpatient Care',
  },
}

/**
 * Returns the currently active verified session from HTTP cookies using JWT.
 * Returns null if no valid, signed JWT token is present.
 */
export async function getSession(): Promise<Session | null> {
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

/**
 * Creates and sets a new JWT session cookie.
 */
export async function createSession(user: AuthUser): Promise<Session> {
  const jar = await cookies()
  const token = await signJWT(user)

  jar.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  })

  // Sync role cookie for non-sensitive client UI reads
  jar.set(ROLE_COOKIE, user.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  })

  return {
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + JWT_MAX_AGE_SECONDS * 1000,
  }
}

/**
 * Updates the user's role in the active session and re-issues a signed JWT.
 */
export async function updateSessionRole(role: Role): Promise<Session | null> {
  const jar = await cookies()
  const user = await getCurrentUser()
  if (!user) return null

  user.role = role
  const token = await signJWT(user)

  jar.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  })

  jar.set(ROLE_COOKIE, role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  })

  return {
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + JWT_MAX_AGE_SECONDS * 1000,
  }
}

/**
 * Clears the session cookie and signs the user out.
 */
export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(JWT_COOKIE_NAME)
  jar.delete(ROLE_COOKIE)
}
