import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AuthUser, Session } from '@/lib/auth/types'
import type { Role } from '@/lib/data/types'
import { ROLE_COOKIE, isRole } from '@/lib/auth/role-meta'

export const SESSION_COOKIE = 'remeet_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

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
 * Encodes a session object into a secure base64 string.
 */
export function encodeSession(session: Session): string {
  try {
    const json = JSON.stringify(session)
    return Buffer.from(json).toString('base64url')
  } catch {
    return ''
  }
}

/**
 * Decodes and validates a session string.
 */
export function decodeSession(raw: string | undefined): Session | null {
  if (!raw) return null
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf-8')
    const session = JSON.parse(json) as Session
    if (!session || !session.user || !session.expiresAt) return null
    if (Date.now() > session.expiresAt) return null
    return session
  } catch {
    return null
  }
}

/**
 * Returns the currently active session from HTTP cookies.
 */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  let session = decodeSession(raw)

  // In development, if no session cookie exists but role cookie does, provide a default demo session
  if (!session && process.env.NODE_ENV !== 'production') {
    const storedRole = jar.get(ROLE_COOKIE)?.value
    if (isRole(storedRole)) {
      const demoUser = DEMO_ACCOUNTS[storedRole] || DEMO_ACCOUNTS.admin
      session = {
        user: { ...demoUser, role: storedRole },
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
      }
    }
  }

  // If role cookie overrides session in development or review mode
  if (session) {
    const storedRole = jar.get(ROLE_COOKIE)?.value
    if (isRole(storedRole) && session.user.role !== storedRole) {
      session.user.role = storedRole
    }
  }

  return session
}

/**
 * Returns the authenticated user or null.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Next.js server-side auth helper. Replaces Clerk's `auth()`.
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
 * Creates and sets a new session cookie.
 */
export async function createSession(user: AuthUser): Promise<Session> {
  const jar = await cookies()
  const now = Date.now()
  const session: Session = {
    user,
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE * 1000,
  }

  const encoded = encodeSession(session)

  jar.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  // Sync role cookie
  jar.set(ROLE_COOKIE, user.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return session
}

/**
 * Updates the user's role in the active session.
 */
export async function updateSessionRole(role: Role): Promise<Session | null> {
  const jar = await cookies()
  const session = await getSession()
  if (!session) return null

  session.user.role = role
  const encoded = encodeSession(session)

  jar.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  jar.set(ROLE_COOKIE, role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return session
}

/**
 * Clears the session cookie and signs the user out.
 */
export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  jar.delete(ROLE_COOKIE)
}
