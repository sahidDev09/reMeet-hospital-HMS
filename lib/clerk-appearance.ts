/**
 * Clerk's forms, wearing reMeet's tokens.
 *
 * Shared between sign-in and sign-up so the two screens are indistinguishable in
 * treatment. Colours are read from CSS variables rather than hard-coded, which
 * means the form follows the theme toggle instead of fighting it.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--accent)',
    colorText: 'var(--ink)',
    colorTextSecondary: 'var(--ink-soft)',
    colorBackground: 'var(--surface-solid)',
    colorInputBackground: 'var(--surface-solid)',
    colorInputText: 'var(--ink)',
    colorDanger: 'var(--vital-crit)',
    colorSuccess: 'var(--vital-ok)',
    colorWarning: 'var(--vital-warn)',
    borderRadius: '0.625rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none',
    card: 'glass !shadow-[var(--shadow-glass)] gap-5',
    headerTitle: 'font-display text-xl tracking-[-0.02em]',
    headerSubtitle: 'text-ink-soft',
    formButtonPrimary:
      'bg-accent text-accent-ink hover:bg-accent-hover text-sm font-medium normal-case shadow-none',
    formFieldInput: 'border-line bg-surface-solid/60',
    footerActionLink: 'text-accent hover:text-accent-hover font-medium',
    socialButtonsBlockButton: 'border-line hover:bg-accent-soft',
    dividerLine: 'bg-line',
    dividerText: 'text-ink-faint',
    identityPreviewEditButton: 'text-accent',
    formFieldLabel: 'text-ink-soft',
    footer: '!bg-transparent',
  },
}
