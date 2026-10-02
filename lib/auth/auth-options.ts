import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authenticateUser, findOrCreateOAuthUser } from '@/lib/auth/user-store'
import { DEMO_ACCOUNTS } from '@/lib/auth/session'
import type { Role } from '@/lib/data/types'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'remeet-hospital-secure-jwt-secret-key-2026-v1',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID.trim(),
            clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
            authorization: {
              params: {
                prompt: 'select_account',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID.trim(),
            clientSecret: process.env.GITHUB_CLIENT_SECRET.trim(),
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
        isDemo: { label: 'Demo Login', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        // 1. Quick demo login bypass
        if (credentials.isDemo === 'true' && credentials.role) {
          const demoUser = DEMO_ACCOUNTS[credentials.role] || DEMO_ACCOUNTS.admin
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            image: demoUser.image,
            role: demoUser.role,
            designation: demoUser.designation,
            department: demoUser.department,
          }
        }

        // 2. Email / password validation
        const email = credentials.email?.toLowerCase().trim()
        if (!email) {
          throw new Error('Email is required.')
        }

        const { user } = await authenticateUser(email, credentials.password)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          designation: user.designation,
          department: user.department,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const providerId = account.providerAccountId || user.id
          const { user: savedUser } = await findOrCreateOAuthUser({
            provider: account.provider,
            providerId,
            email: user.email || '',
            name: user.name || (account.provider === 'google' ? 'Google User' : 'GitHub User'),
            image: user.image || undefined,
          })
          user.id = savedUser.id
          ;(user as any).role = savedUser.role
          ;(user as any).designation = savedUser.designation
          ;(user as any).department = savedUser.department
          return true
        } catch (err) {
          console.error('Error during OAuth signIn callback:', err)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'staff'
        token.designation = (user as any).designation
        token.department = (user as any).department
      }
      if (trigger === 'update' && session?.role) {
        token.role = session.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).role = (token.role as Role) || 'staff'
        ;(session.user as any).designation = token.designation as string
        ;(session.user as any).department = token.department as string
      }
      return session
    },
  },
}
