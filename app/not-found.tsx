'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ArrowLeft, Sparkles, Home, LayoutDashboard } from 'lucide-react'
import { Wordmark } from '@/components/brand/logo'

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null)
  const numbersRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })

      // Entrance sequence
      tl.fromTo(
        numbersRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1 }
      )
        .fromTo(
          catRef.current,
          { opacity: 0, scale: 0.85, y: 40 },
          { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'back.out(1.4)' },
          '-=0.7'
        )
        .fromTo(
          textRef.current?.children ? Array.from(textRef.current.children) : [],
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          '-=0.7'
        )

      // Continuous gentle bobbing animation on the cat doctor
      if (catRef.current) {
        gsap.to(catRef.current, {
          y: -10,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }

      // Synchronized subtle shadow scaling
      if (shadowRef.current) {
        gsap.to(shadowRef.current, {
          scaleX: 0.88,
          opacity: 0.6,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <main 
      ref={containerRef}
      className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-gradient-to-b from-[#b8d6fc] via-[#dcebff] to-[#eef2fa] px-4 py-6 select-none dark:from-[#0b1322] dark:via-[#0e192f] dark:to-[#070b14] sm:px-8 sm:py-8"
    >
      {/* Background Soft Atmospheric Clouds */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-white/40 blur-3xl dark:bg-sky-950/20" />
        <div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl dark:bg-indigo-950/30" />
        <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl dark:bg-sky-900/20" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/80 shadow-sm backdrop-blur-md dark:bg-white/10">
            <Sparkles className="size-4 text-accent" />
          </div>
          <Wordmark className="text-xl text-ink" />
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/sign-in"
            className="rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Center 404 & Cat Doctor Hero Stage */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center py-4 text-center">
        {/* Giant 404 Numbers + Centered Cat Doctor */}
        <div className="relative flex items-center justify-center">
          {/* Giant Typographic 404 in Background */}
          <div
            ref={numbersRef}
            className="flex items-center justify-center font-display font-black tracking-tighter text-white select-none dark:text-white/15 drop-shadow-[0_4px_16px_rgba(37,99,235,0.08)]"
            style={{
              fontSize: 'clamp(7rem, 24vw, 21rem)',
              lineHeight: 0.9,
            }}
          >
            <span className="translate-x-3 sm:translate-x-6">4</span>
            <span className="opacity-0 w-[0.7em]">0</span>
            <span className="-translate-x-3 sm:-translate-x-6">4</span>
          </div>

          {/* Cat Doctor Character in Foreground */}
          <div
            ref={catRef}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative w-[210px] sm:w-[280px] md:w-[340px] lg:w-[380px] aspect-square">
              <Image
                src="/assets/cat404.png"
                alt="404 Cat Doctor"
                fill
                priority
                className="object-contain drop-shadow-[0_16px_28px_rgba(16,19,28,0.18)] dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
              />
            </div>
            
            {/* Contact Floor Shadow */}
            <div
              ref={shadowRef}
              className="-mt-3 h-5 w-36 rounded-full bg-black/15 blur-sm dark:bg-black/50 sm:w-52"
            />
          </div>
        </div>

        {/* Content & Action Section */}
        <div ref={textRef} className="mt-4 flex flex-col items-center gap-3 sm:mt-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Oops, i think we&apos;re lost
          </h1>
          <p className="max-w-md text-sm font-medium text-ink-soft sm:text-base">
            Let&apos;s get you back somewhere familiar...
          </p>

          {/* Action Navigation Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-surface-strong hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <ArrowLeft className="size-4" />
              <span>Back to home</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-all hover:bg-accent-hover hover:scale-105 active:scale-95"
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="relative z-10 mx-auto w-full max-w-7xl text-center">
        <p className="font-mono text-[0.6875rem] text-ink-faint">
          reMeet Hospital Management System · Error 404
        </p>
      </footer>
    </main>
  )
}
