import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthSplitWrapper } from '@/components/auth/auth-split-wrapper'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = { title: 'Create an account' }

export default function SignUpPage() {
  return (
    <AuthSplitWrapper mode="sign-up">
      <Suspense fallback={<div className="h-48 w-full animate-pulse rounded-xl bg-surface-strong" />}>
        <SignUpForm />
      </Suspense>
    </AuthSplitWrapper>
  )
}
