import type { Metadata } from 'next'
import { AuthSplitWrapper } from '@/components/auth/auth-split-wrapper'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = { title: 'Create an account' }

export default function SignUpPage() {
  return (
    <AuthSplitWrapper mode="sign-up">
      <SignUpForm />
    </AuthSplitWrapper>
  )
}
