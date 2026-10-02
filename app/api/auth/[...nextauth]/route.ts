import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { NextRequest, NextResponse } from 'next/server'
import { registerUser, updateUserRole } from '@/lib/auth/user-store'
import { isRole } from '@/lib/auth/role-meta'
import { createSession, destroySession, updateSessionRole, getCurrentUser, DEMO_ACCOUNTS } from '@/lib/auth/session'

const handler = NextAuth(authOptions)

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await props.params
  return handler(req, { params })
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await props.params
  const action = params?.nextauth?.[0]

  // Custom user registration into users.json
  if (action === 'register') {
    const body = await req.json().catch(() => ({}))
    const { name, email, password, role } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }
    if (password && password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const cleanRole = isRole(role) ? role : 'staff'
    try {
      const { user } = await registerUser({ name, email, password, role: cleanRole })
      const res = NextResponse.json({ success: true, user, isFirstLogin: true })
      await createSession(user, res)
      return res
    } catch (err: unknown) {
      const errorObj = err as Error
      return NextResponse.json({ error: errorObj.message || 'Registration failed.' }, { status: 400 })
    }
  }

  // Custom switch-role
  if (action === 'switch-role') {
    const body = await req.json().catch(() => ({}))
    const { role } = body

    if (!isRole(role)) {
      return NextResponse.json({ error: 'Invalid role selected.' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (currentUser?.id) {
      await updateUserRole(currentUser.id, role)
    }

    const res = NextResponse.json({ success: true })
    const session = await updateSessionRole(role, res)
    return NextResponse.json({ success: true, session }, { headers: res.headers })
  }

  // Custom quick demo-login
  if (action === 'demo-login') {
    const body = await req.json().catch(() => ({}))
    const roleKey = body.role || 'admin'
    const demoUser = DEMO_ACCOUNTS[roleKey] || DEMO_ACCOUNTS.admin

    const res = NextResponse.json({ success: true })
    const session = await createSession(demoUser, res)
    return NextResponse.json({ success: true, session, user: session.user }, { headers: res.headers })
  }

  // Custom logout
  if (action === 'logout') {
    const res = NextResponse.json({ success: true })
    await destroySession(res)
    return res
  }

  return handler(req, { params })
}
