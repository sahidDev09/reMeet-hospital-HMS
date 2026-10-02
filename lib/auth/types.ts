import type { Role } from '@/lib/data/types'

export type AuthProvider = 'google' | 'github' | 'credentials' | 'demo' | 'next-auth'

export interface AuthUser {
  id: string
  name: string
  email: string
  image?: string
  role: Role
  provider: AuthProvider
  designation?: string
  department?: string
}

export interface Session {
  user: AuthUser
  expiresAt: number
  createdAt: number
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAuthenticated: boolean
}
