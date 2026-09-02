import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'
import { AuthSplitWrapper } from '@/components/auth/auth-split-wrapper'

export const metadata: Metadata = { title: 'Create an account' }

export default function SignUpPage() {
  return (
    <AuthSplitWrapper mode="sign-up">
      <SignUp appearance={clerkAppearance} />
    </AuthSplitWrapper>
  )
}



