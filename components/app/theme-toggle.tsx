'use client'

import * as React from 'react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { gsap } from '@/components/motion/gsap'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const activeOverlayRef = React.useRef<HTMLDivElement | null>(null)
  const rawId = React.useId()
  // Clean id for SVG mask
  const maskId = `theme-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  React.useEffect(() => {
    setMounted(true)
    return () => {
      if (activeOverlayRef.current) {
        activeOverlayRef.current.remove()
        activeOverlayRef.current = null
      }
    }
  }, [])

  // Default to light until mounted on client to prevent hydration mismatch
  const currentTheme = mounted ? resolvedTheme : 'light'
  const isDark = currentTheme === 'dark'

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark'

    // If reduced motion is requested or in SSR, toggle immediately
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTheme(next)
      return
    }

    // Clean up any in-flight overlay to prevent stacking on rapid clicks
    if (activeOverlayRef.current) {
      gsap.killTweensOf(activeOverlayRef.current)
      activeOverlayRef.current.remove()
      activeOverlayRef.current = null
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(rect.left + rect.width / 2)
    const y = Math.round(rect.top + rect.height / 2)

    const maxRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
    )

    // Full-screen expanding portal overlay
    const overlay = document.createElement('div')
    overlay.className = 'theme-transition-portal'
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.zIndex = '99999'
    overlay.style.pointerEvents = 'none'
    overlay.style.willChange = 'clip-path, opacity'
    overlay.style.background =
      next === 'dark'
        ? `radial-gradient(circle at ${x}px ${y}px, #131824 0%, #0b0e17 65%, #070912 100%)`
        : `radial-gradient(circle at ${x}px ${y}px, #ffffff 0%, #eef0fa 65%, #e4e8f7 100%)`

    document.body.appendChild(overlay)
    activeOverlayRef.current = overlay

    const tl = gsap.timeline({
      onComplete: () => {
        if (activeOverlayRef.current === overlay) {
          overlay.remove()
          activeOverlayRef.current = null
        }
      },
    })

    tl.fromTo(
      overlay,
      {
        clipPath: `circle(0px at ${x}px ${y}px)`,
        opacity: 1,
      },
      {
        clipPath: `circle(${maxRadius}px at ${x}px ${y}px)`,
        duration: 0.44,
        ease: 'power3.inOut',
      }
    )
      .call(
        () => {
          setTheme(next)
        },
        undefined,
        0.26
      )
      .to(
        overlay,
        {
          opacity: 0,
          duration: 0.22,
          ease: 'power2.out',
        },
        '+=0.02'
      )
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setTheme('system')
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onContextMenu={handleContextMenu}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={
        mounted
          ? `${isDark ? 'Dark' : 'Light'} theme active (${theme === 'system' ? 'System' : 'Manual'}). Click to toggle, right-click for System.`
          : 'Toggle theme'
      }
      className={cn(
        'group relative flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface/70 text-ink-soft transition-all duration-200',
        'hover:border-line-strong hover:bg-surface-strong hover:text-ink active:scale-95',
        className,
      )}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5 text-ink-soft transition-colors duration-200 group-hover:text-ink"
        animate={{
          rotate: isDark ? 40 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <motion.circle
            animate={{
              cx: isDark ? 16 : 26,
              cy: isDark ? 8 : 0,
              r: isDark ? 7.5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 25 }}
            fill="black"
          />
        </mask>

        {/* Center celestial body (Sun sphere -> Crescent Moon) */}
        <motion.circle
          cx="12"
          cy="12"
          animate={{
            r: isDark ? 8 : 4.5,
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 25 }}
          fill="currentColor"
          mask={`url(#${maskId})`}
        />

        {/* Sun rays (8 delicate rays that burst in light mode and contract in dark mode) */}
        <motion.g
          stroke="currentColor"
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? 45 : 0,
          }}
          style={{ transformOrigin: '12px 12px' }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <line x1="12" y1="2" x2="12" y2="4.2" />
          <line x1="12" y1="19.8" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="6.48" y2="6.48" />
          <line x1="17.52" y1="17.52" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="4.2" y2="12" />
          <line x1="19.8" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="6.48" y2="17.52" />
          <line x1="17.52" y1="6.48" x2="19.07" y2="4.93" />
        </motion.g>
      </motion.svg>
    </button>
  )
}
