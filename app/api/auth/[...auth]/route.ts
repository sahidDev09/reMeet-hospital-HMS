import { NextRequest, NextResponse } from 'next/server'
import {
  getSession,
  createSession,
  destroySession,
  updateSessionRole,
  DEMO_ACCOUNTS,
} from '@/lib/auth/session'
import type { AuthUser } from '@/lib/auth/types'
import { isRole } from '@/lib/auth/role-meta'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth: string[] }> }
) {
  const { auth } = await params
  const action = auth?.[0]

  if (action === 'session') {
    const session = await getSession()
    return NextResponse.json({ session })
  }

  // OAuth Callback handling
  if (action === 'callback') {
    const provider = auth?.[1]
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error)}`, request.url))
    }

    // If OAuth code exchange is configured with real client credentials
    if (provider === 'google' && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && code) {
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

        if (tokenData.access_token) {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          })
          const userData = await userRes.json()

          const isAdmin = userData.email?.toLowerCase() === 'iambotforwork72@gmail.com'
          const authUser: AuthUser = {
            id: `google_${userData.id}`,
            name: userData.name || 'Google User',
            email: userData.email || '',
            image: userData.picture || '/images/doctors/doc_02.jpg',
            role: isAdmin ? 'admin' : 'staff',
            provider: 'google',
          }

          await createSession(authUser)
          return NextResponse.redirect(new URL(isAdmin ? '/dashboard' : '/?onboarding=true', request.url))
        }
      } catch (err) {
        console.error('Google OAuth exchange error:', err)
      }
    }

    if (provider === 'github' && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && code) {
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

        if (tokenData.access_token) {
          const userRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'reMeet-App' },
          })
          const userData = await userRes.json()

          const authUser: AuthUser = {
            id: `github_${userData.id}`,
            name: userData.name || userData.login || 'GitHub User',
            email: userData.email || `${userData.login}@users.noreply.github.com`,
            image: userData.avatar_url || '/images/doctors/doc_03.jpg',
            role: 'staff',
            provider: 'github',
          }

          await createSession(authUser)
          return NextResponse.redirect(new URL('/?onboarding=true', request.url))
        }
      } catch (err) {
        console.error('GitHub OAuth exchange error:', err)
      }
    }

    // Default fallback OAuth redirect
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auth: string[] }> }
) {
  const { auth } = await params
  const action = auth?.[0]

  // 1. Demo role quick login
  if (action === 'demo-login') {
    const body = await request.json().catch(() => ({}))
    const roleKey = body.role || 'admin'
    const demoUser = DEMO_ACCOUNTS[roleKey] || DEMO_ACCOUNTS.admin

    const session = await createSession(demoUser)
    return NextResponse.json({ success: true, session, user: session.user })
  }

  // 2. OAuth initiation
  if (action === 'oauth') {
    const provider = request.nextUrl.searchParams.get('provider') || 'google'

    // If real credentials exist, return OAuth redirect URL
    if (provider === 'google' && process.env.GOOGLE_CLIENT_ID) {
      const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=openid%20email%20profile`
      return NextResponse.json({ url })
    }

    if (provider === 'github' && process.env.GITHUB_CLIENT_ID) {
      const redirectUri = `${request.nextUrl.origin}/api/auth/callback/github`
      const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=user:email`
      return NextResponse.json({ url })
    }

    // Instant seamless OAuth simulation for demo/dev mode
    const simulatedUser: AuthUser = {
      id: `usr_oauth_${Date.now()}`,
      name: provider === 'google' ? 'Google Medical User' : 'GitHub Developer User',
      email: provider === 'google' ? 'google.user@remeet.health' : 'dev@remeet.health',
      image: provider === 'google' ? '/images/doctors/doc_01.jpg' : '/images/doctors/doc_04.jpg',
      role: 'staff',
      provider: provider as 'google' | 'github',
    }

    const session = await createSession(simulatedUser)
    return NextResponse.json({ success: true, session, user: session.user })
  }

  // 3. Email/Password login
  if (action === 'login') {
    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Match known demo accounts or generate clean auth user
    let user: AuthUser | undefined

    if (cleanEmail === 'iambotforwork72@gmail.com') {
      if (password && password !== 'remeet2026') {
        return NextResponse.json({ error: 'Incorrect password for administrator account.' }, { status: 401 })
      }
      user = DEMO_ACCOUNTS.admin
    } else if (cleanEmail === 'dr.eleanor@remeet.health') {
      user = DEMO_ACCOUNTS.doctor
    } else if (cleanEmail === 'staff@remeet.health') {
      user = DEMO_ACCOUNTS.staff
    } else if (cleanEmail === 'patient@remeet.health') {
      user = DEMO_ACCOUNTS.patient
    } else {
      user = {
        id: `usr_${Date.now()}`,
        name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        email: cleanEmail,
        role: 'staff',
        provider: 'credentials',
        image: '/images/doctors/doc_05.jpg',
      }
    }

    const session = await createSession(user)
    return NextResponse.json({ success: true, session, user: session.user })
  }

  // 4. Registration
  if (action === 'register') {
    const body = await request.json().catch(() => ({}))
    const { name, email, role } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const cleanRole = isRole(role) ? role : 'staff'
    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: cleanRole,
      provider: 'credentials',
      image: '/images/doctors/doc_06.jpg',
    }

    const session = await createSession(newUser)
    return NextResponse.json({ success: true, session, user: session.user })
  }

  // 5. Switch Role
  if (action === 'switch-role') {
    const body = await request.json().catch(() => ({}))
    const { role } = body

    if (!isRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
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
