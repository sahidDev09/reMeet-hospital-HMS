import type { Role } from '@/lib/data/types'
import type { AuthUser, Session } from '@/lib/auth/types'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      session?: Session
    }
  }
}

export {}
