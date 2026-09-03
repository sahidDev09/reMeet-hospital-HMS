import type { Metadata } from 'next'
import { AuthSplitWrapper } from '@/components/auth/auth-split-wrapper'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <AuthSplitWrapper mode="sign-in">
      <SignInForm />
    </AuthSplitWrapper>
  )
}
