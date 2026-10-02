import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true, redirect: '/' })
  await destroySession(res)
  return res
}

export async function GET(req: NextRequest) {
  const url = new URL('/', req.url)
  const res = NextResponse.redirect(url)
  await destroySession(res)
  return res
}
