import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT, JWT_COOKIE_NAME } from '@/lib/auth/jwt'
import { homeFor } from '@/lib/auth/role-meta'

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
]

// Auth routes that authenticated users should be redirected away from
const AUTH_ROUTES = ['/sign-in', '/sign-up']

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value
  const user = token ? await verifyJWT(token) : null
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

    // Role-based route authorization: doctor role redirection
    if (user.role === 'doctor' && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/portal', request.url))
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
