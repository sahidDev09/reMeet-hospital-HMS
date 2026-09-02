import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'
import { AuthSplitWrapper } from '@/components/auth/auth-split-wrapper'

export const metadata: Metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <AuthSplitWrapper mode="sign-in">
      <SignIn appearance={clerkAppearance} />
    </AuthSplitWrapper>
  )
}



