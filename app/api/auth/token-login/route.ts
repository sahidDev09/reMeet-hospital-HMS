import { NextRequest, NextResponse } from 'next/server'
import { DEMO_ADMIN_TOKEN, DEMO_ACCOUNTS, createSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Login token is required.' }, { status: 400 })
    }

    const cleanToken = token.trim()

    if (cleanToken === DEMO_ADMIN_TOKEN) {
      const adminUser = DEMO_ACCOUNTS.admin
      const res = NextResponse.json({
        success: true,
        user: adminUser,
        redirect: '/dashboard',
        message: 'Administrator authenticated successfully via token.',
      })

      await createSession(adminUser, res)
      return res
    }

    return NextResponse.json(
      { error: 'Invalid administrator login token. Please use REMEET-ADMIN-TOKEN-2026.' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Token login error:', error)
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 })
  }
}
