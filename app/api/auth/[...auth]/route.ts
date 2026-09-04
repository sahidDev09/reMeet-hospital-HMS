import { NextRequest, NextResponse } from 'next/server'
import {
  getSession,
  createSession,
  destroySession,
  updateSessionRole,
  getCurrentUser,
  DEMO_ACCOUNTS,
} from '@/lib/auth/session'
import {
  authenticateUser,
  registerUser,
  findOrCreateOAuthUser,
  updateUserRole,
} from '@/lib/auth/user-store'
import type { Role } from '@/lib/data/types'
import { isRole, homeFor } from '@/lib/auth/role-meta'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auth: string[] }> }
) {
  const { auth } = await context.params
  const action = auth?.[0]

  // 1. Session check
  if (action === 'session') {
    const session = await getSession()
    return NextResponse.json({ session })
  }

  // 2. OAuth Callback handling (Google & GitHub)
  if (action === 'callback') {
    const provider = auth?.[1]
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(`Authentication cancelled or failed: ${error}`)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/sign-in?error=Missing+authorization+code+from+provider', request.url)
      )
    }

    // Google OAuth Callback
    if (provider === 'google') {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.redirect(
          new URL('/sign-in?error=Google+OAuth+credentials+not+configured+in+.env.local', request.url)
        )
      }

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${request.nextUrl.origin}/api/auth/callback/google`,
            grant_type: 'authorization_code',
          }),
        })
        const tokenData = await tokenRes.json()

        if (!tokenData.access_token) {
          return NextResponse.redirect(
            new URL(`/sign-in?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange Google token')}`, request.url)
          )
        }

        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        const userData = await userRes.json()

        const { user, isNewUser } = await findOrCreateOAuthUser({
          provider: 'google',
          providerId: userData.id,
          email: userData.email,
          name: userData.name || 'Google User',
          image: userData.picture || '/images/doctors/doc_02.jpg',
        })

        await createSession(user)

        // For first-time login, open role selection modal
        if (isNewUser) {
          return NextResponse.redirect(new URL('/?onboarding=true', request.url))
        }

        return NextResponse.redirect(new URL(homeFor(user.role), request.url))
      } catch (err: unknown) {
        const errorObj = err as Error
        console.error('Google OAuth error:', errorObj)
        return NextResponse.redirect(
          new URL(`/sign-in?error=${encodeURIComponent(errorObj.message || 'Google authentication failed')}`, request.url)
        )
      }
    }

    // GitHub OAuth Callback
    if (provider === 'github') {
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return NextResponse.redirect(
          new URL('/sign-in?error=GitHub+OAuth+credentials+not+configured+in+.env.local', request.url)
        )
      }

      try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
          }),
        })
        const tokenData = await tokenRes.json()

        if (!tokenData.access_token) {
          return NextResponse.redirect(
            new URL(`/sign-in?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange GitHub token')}`, request.url)
          )
        }

        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'reMeet-App' },
        })
        const userData = await userRes.json()

        // Fetch primary email if not returned on main profile
        let userEmail = userData.email
        if (!userEmail) {
          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'reMeet-App' },
          })
          const emails = await emailRes.json().catch(() => [])
          const primaryEmailObj = Array.isArray(emails) ? emails.find((e: { primary?: boolean; email: string }) => e.primary) : null
          userEmail = primaryEmailObj?.email || `${userData.login}@users.noreply.github.com`
        }

        const { user, isNewUser } = await findOrCreateOAuthUser({
          provider: 'github',
          providerId: String(userData.id),
          email: userEmail,
          name: userData.name || userData.login || 'GitHub User',
          image: userData.avatar_url || '/images/doctors/doc_03.jpg',
        })

        await createSession(user)

        // For first-time login, open role selection modal
        if (isNewUser) {
          return NextResponse.redirect(new URL('/?onboarding=true', request.url))
        }

        return NextResponse.redirect(new URL(homeFor(user.role), request.url))
      } catch (err: unknown) {
        const errorObj = err as Error
        console.error('GitHub OAuth error:', errorObj)
        return NextResponse.redirect(
          new URL(`/sign-in?error=${encodeURIComponent(errorObj.message || 'GitHub authentication failed')}`, request.url)
        )
      }
    }

    return NextResponse.redirect(new URL('/sign-in?error=Unknown+OAuth+provider', request.url))
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ auth: string[] }> }
) {
  const { auth } = await context.params
  const action = auth?.[0]

  // 1. Email/Password Authentication (Strict & Validated against users.json)
  if (action === 'login') {
    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
    }

    try {
      const { user, isFirstLogin } = await authenticateUser(email, password)
      const session = await createSession(user)
      return NextResponse.json({ success: true, session, user, isFirstLogin })
    } catch (err: unknown) {
      const errorObj = err as Error
      return NextResponse.json({ error: errorObj.message || 'Login failed.' }, { status: 401 })
    }
  }

  // 2. User Registration (Stored into users.json)
  if (action === 'register') {
    const body = await request.json().catch(() => ({}))
    const { name, email, password, role } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const cleanRole = isRole(role) ? role : 'staff'

    try {
      const { user } = await registerUser({
        name,
        email,
        password,
        role: cleanRole,
      })

      const session = await createSession(user)
      return NextResponse.json({ success: true, session, user, isFirstLogin: true })
    } catch (err: unknown) {
      const errorObj = err as Error
      return NextResponse.json({ error: errorObj.message || 'Registration failed.' }, { status: 400 })
    }
  }

  // 3. OAuth Initiation (Checks for configured keys)
  if (action === 'oauth') {
    const provider = request.nextUrl.searchParams.get('provider') || 'google'

    if (provider === 'google') {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json(
          {
            error:
              'Google OAuth is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local to enable Google sign in.',
          },
          { status: 400 }
        )
      }

      const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=openid%20email%20profile`
      return NextResponse.json({ url })
    }

    if (provider === 'github') {
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return NextResponse.json(
          {
            error:
              'GitHub OAuth is not configured yet. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local to enable GitHub sign in.',
          },
          { status: 400 }
        )
      }

      const redirectUri = `${request.nextUrl.origin}/api/auth/callback/github`
      const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=user:email`
      return NextResponse.json({ url })
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }

  // 4. Quick Demo Login (Uses seeded accounts from users.json / DEMO_ACCOUNTS)
  if (action === 'demo-login') {
    const body = await request.json().catch(() => ({}))
    const roleKey = body.role || 'admin'
    const demoUser = DEMO_ACCOUNTS[roleKey] || DEMO_ACCOUNTS.admin

    const session = await createSession(demoUser)
    return NextResponse.json({ success: true, session, user: session.user })
  }

  // 5. Switch Role / Select Initial Role
  if (action === 'switch-role' || action === 'update-role') {
    const body = await request.json().catch(() => ({}))
    const { role } = body

    if (!isRole(role)) {
      return NextResponse.json({ error: 'Invalid role selected.' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (currentUser?.id) {
      await updateUserRole(currentUser.id, role)
    }

    const session = await updateSessionRole(role)
    return NextResponse.json({ success: true, session })
  }

  // 6. Sign Out
  if (action === 'logout') {
    await destroySession()
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
}
