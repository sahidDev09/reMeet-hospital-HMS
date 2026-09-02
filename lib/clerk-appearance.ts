/**
 * Clerk's forms styled to match the clean medical design system.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#0f172a',
    colorDanger: '#ef4444',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
  },
  elements: {
    rootBox: 'w-full max-w-[430px] mx-auto',
    cardBox: 'w-full !shadow-none !border-none !bg-transparent',
    card: 'w-full !shadow-none !border-none !bg-transparent !p-0 gap-4',
    header: 'text-center mb-1.5',
    headerTitle: 'font-display text-3xl font-bold tracking-tight text-slate-900 text-center',
    headerSubtitle: 'text-slate-500 text-sm mt-1.5 text-center',
    form: 'gap-3.5',
    formField: 'gap-1.5',
    formFieldLabel: 'text-xs font-semibold text-slate-700',
    formFieldInput:
      'h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all shadow-none',
    formFieldAction: 'text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors',
    formButtonPrimary:
      'h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-all shadow-sm normal-case mt-2 cursor-pointer',
    dividerRow: 'my-2.5',
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400 text-xs font-medium uppercase px-3 bg-white',
    socialButtonsBlockButton:
      'h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all shadow-none flex items-center justify-center gap-2.5 cursor-pointer',
    socialButtonsBlockButtonText: 'font-medium text-slate-700 text-sm',
    socialButtonsProviderIcon: 'size-4.5',
    identityPreviewText: 'text-sm font-medium text-slate-900',
    identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 font-medium text-xs',
    footer: '!bg-transparent pt-2',
    footerAction: 'justify-center text-sm text-slate-500',
    footerActionText: 'text-slate-500 text-sm',
    footerActionLink: 'text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors',
    alert: 'rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs p-3',
    alertText: 'text-red-700 text-xs',
  },
}

export const clerkLocalization = {
  signIn: {
    start: {
      title: 'Welcome Back',
      subtitle: 'Please enter your credentials below to access your portal',
      actionText: "Don't have an account?",
      actionLink: 'Sign Up',
    },
    password: {
      title: 'Welcome Back',
      subtitle: 'Please enter your password to continue',
      actionLink: 'Forgot password?',
    },
  },
  signUp: {
    start: {
      title: 'Create Account',
      subtitle: 'Please enter your details below to register',
      actionText: 'Already have an account?',
      actionLink: 'Sign In',
    },
  },
  formFieldLabel__emailAddress: 'E-mail',
  formFieldLabel__password: 'Password',
  formFieldInputPlaceholder__emailAddress: 'Enter your email',
  formFieldInputPlaceholder__password: 'Enter your password',
  formButtonPrimary: 'Login',
  dividerText: 'Or',
}


