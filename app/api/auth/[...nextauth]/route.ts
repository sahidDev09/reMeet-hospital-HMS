import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { NextRequest, NextResponse } from 'next/server'
import { registerUser, updateUserRole } from '@/lib/auth/user-store'
import { isRole } from '@/lib/auth/role-meta'
import { createSession, destroySession, updateSessionRole, getCurrentUser, DEMO_ACCOUNTS } from '@/lib/auth/session'

import { verifyJWT, JWT_COOKIE_NAME } from '@/lib/auth/jwt'

const handler = NextAuth(authOptions)

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await props.params
  const action = params?.nextauth?.[0]

  if (action === 'session') {
    const nextAuthRes = await handler(req, { params })
    try {
      const text = await nextAuthRes.text()
      const data = text ? JSON.parse(text) : {}
      if (data?.user) {
        return NextResponse.json(data)
      }
    } catch {
      // fallback
    }

    // Check custom JWT session token
    const token = req.cookies.get(JWT_COOKIE_NAME)?.value
    const customUser = token ? await verifyJWT(token) : null
    if (customUser) {
      return NextResponse.json({
        user: {
          id: customUser.id,
          name: customUser.name,
          email: customUser.email,
          role: customUser.role,
          image: customUser.image || '/images/doctors/doc_02.jpg',
          designation: customUser.designation,
          department: customUser.department,
        },
        expires: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
    }

    return NextResponse.json({})
  }

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

      // If registered as doctor or front desk staff, register verification request for administrator approval
      if (cleanRole === 'doctor' || cleanRole === 'staff') {
        try {
          const { createVerificationRequest } = await import('@/lib/data/verifications')
          await createVerificationRequest({
            fullName: name,
            email,
            designation: cleanRole === 'doctor' ? 'Clinical Practitioner' : 'Front Desk Staff',
            idNumber: `${cleanRole === 'doctor' ? 'DOC' : 'DESK'}-${Math.floor(1000 + Math.random() * 9000)}`,
            role: cleanRole,
          })
        } catch (e) {
          console.error('Failed to create automatic verification request:', e)
        }
      }

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

    // Patient rule: Patients cannot access other roles
    if (currentUser?.role === 'patient') {
      return NextResponse.json(
        { error: 'Patients are not permitted to switch to clinical or administrative roles.' },
        { status: 403 }
      )
    }

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
    
    // Check if token was provided
    if (body.token === 'REMEET-ADMIN-TOKEN-2026') {
      const adminUser = DEMO_ACCOUNTS.admin
      const res = NextResponse.json({ success: true })
      const session = await createSession(adminUser, res)
      return NextResponse.json({ success: true, session, user: session.user }, { headers: res.headers })
    }

    const roleKey = body.role || 'admin'
    const demoUser = DEMO_ACCOUNTS[roleKey] || DEMO_ACCOUNTS.admin

    const res = NextResponse.json({ success: true })
    const session = await createSession(demoUser, res)
    return NextResponse.json({ success: true, session, user: session.user }, { headers: res.headers })
  }

  // Custom logout
  if (action === 'logout') {
    const res = NextResponse.json({ success: true, redirect: '/' })
    await destroySession(res)
    return res
  }

  return handler(req, { params })
}
