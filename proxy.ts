import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyJWT, JWT_COOKIE_NAME } from '@/lib/auth/jwt'
import { homeFor } from '@/lib/auth/role-meta'
import type { Role } from '@/lib/data/types'

// Protected route prefixes that require valid JWT authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/appointments',
  '/patients',
  '/prescriptions',
  '/portal',
  '/pharmacy',
  '/pos',
  '/billing',
  '/analytics',
  '/settings',
  '/admin',
  '/patient',
  '/doctors',
]

// Auth routes that authenticated users should be redirected away from
const AUTH_ROUTES = ['/sign-in', '/sign-up']

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Verify NextAuth token first
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'remeet-hospital-secure-jwt-secret-key-2026-v1',
  })

  // Fallback to custom JWT token
  const legacyToken = request.cookies.get(JWT_COOKIE_NAME)?.value
  const legacyUser = legacyToken ? await verifyJWT(legacyToken) : null

  const user = nextAuthToken
    ? {
        id: (nextAuthToken.id as string) || nextAuthToken.sub || 'usr_oauth',
        name: nextAuthToken.name || 'User',
        email: nextAuthToken.email || '',
        role: ((nextAuthToken.role as string) || 'staff') as Role,
      }
    : legacyUser

  const isAuthenticated = !!user

  // 1. Gating protected routes
  const isProtected = PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (isProtected) {
    if (!isAuthenticated) {
      const fullPath = `${pathname}${search}`
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect', fullPath)
      return NextResponse.redirect(signInUrl)
    }

    // 1. Patient boundary: Patients can never access other roles (doctor, admin, staff)
    if (user.role === 'patient') {
      if (pathname !== '/patient' && !pathname.startsWith('/patient/')) {
        return NextResponse.redirect(new URL('/patient', request.url))
      }
    }

    // 2. Doctor boundary: Doctor attempting to access dashboard, admin or analytics
    if (user.role === 'doctor') {
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/analytics')) {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }

    // 3. Non-admin attempting to access /admin or /analytics routes
    if (user.role !== 'admin' && (pathname.startsWith('/admin') || pathname.startsWith('/analytics'))) {
      return NextResponse.redirect(new URL(homeFor(user.role), request.url))
    }
  }

  // 2. Redirect authenticated users away from sign-in / sign-up
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (isAuthRoute && isAuthenticated) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect')
    if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.redirect(new URL(homeFor(user.role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images / assets (public images)
     * - api routes (handled individually or via their own handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|assets|api).*)',
  ],
}
