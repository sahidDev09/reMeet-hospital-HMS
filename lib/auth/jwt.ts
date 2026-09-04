import { SignJWT, jwtVerify } from 'jose'
import type { AuthUser } from '@/lib/auth/types'

const JWT_SECRET = process.env.JWT_SECRET || 'remeet-hospital-secure-jwt-secret-key-2026-v1'
const KEY = new TextEncoder().encode(JWT_SECRET)

export const JWT_COOKIE_NAME = 'remeet_token'
export const JWT_EXPIRATION_TIME = '30d'
export const JWT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface JWTPayloadData {
  user: AuthUser
  [key: string]: unknown
}

/**
 * Signs a cryptographic JWT containing the authenticated user's profile.
 */
export async function signJWT(user: AuthUser): Promise<string> {
  try {
    return await new SignJWT({ user })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION_TIME)
      .sign(KEY)
  } catch (error) {
    console.error('Failed to sign JWT:', error)
    throw new Error('JWT generation failed')
  }
}

/**
 * Verifies a cryptographic JWT and extracts the authenticated user's profile.
 */
export async function verifyJWT(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, KEY, {
      algorithms: ['HS256'],
    })

    const payloadData = payload as unknown as JWTPayloadData
    if (!payloadData || !payloadData.user || !payloadData.user.id) {
      return null
    }

    return payloadData.user
  } catch {
    // Token is expired, invalid, or tampered
    return null
  }
}
