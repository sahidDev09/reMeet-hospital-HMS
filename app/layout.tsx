import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { OnboardingModal } from '@/components/auth/onboarding-modal'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'reMeet — hospital management, end to end',
    template: '%s · reMeet',
  },
  description:
    'Appointments, records, prescriptions, pharmacy and billing in one system. Built for clinics that need the whole visit in one place.',
  applicationName: 'reMeet',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef0fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e17' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/*
            Fonts load at runtime via <link> rather than next/font. next/font
            fetches at build time, which fails in an offline build environment;
            this works everywhere. The families are declared in globals.css, so
            moving to next/font later is a two-file change.
          */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          />
        </head>
        <body className="min-h-dvh bg-bg text-ink antialiased">
          <ThemeProvider>
            {children}
            <Suspense fallback={null}>
              <OnboardingModal />
            </Suspense>
            <Toaster
              position="bottom-right"
              toastOptions={{
                classNames: {
                  toast:
                    'glass !bg-surface-strong !text-ink !border-line !rounded-xl !font-sans !text-sm',
                  description: '!text-ink-soft',
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
