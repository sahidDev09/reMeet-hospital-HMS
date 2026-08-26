import type { Role } from '@/lib/data/types'

/**
 * Clerk puts whatever you map in Dashboard → Sessions → Customize session token
 * onto the session claims. reMeet maps public metadata:
 *
 *   { "metadata": "{{user.public_metadata}}" }
 *
 * Declaring the shape here is what makes `sessionClaims.metadata.role` typed
 * instead of `unknown` at every call site.
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: Role
    }
  }
}

export {}
