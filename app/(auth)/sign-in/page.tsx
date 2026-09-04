import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthSplitWrapper } from '@/components/auth/auth-split-wrapper'
import { SignInForm } from '@/components/auth/sign-in-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <AuthSplitWrapper mode="sign-in">
      <Suspense fallback={<div className="h-48 w-full animate-pulse rounded-xl bg-surface-strong" />}>
        <SignInForm />
      </Suspense>
    </AuthSplitWrapper>
  )
}
