'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Star, 
  ArrowUpRight,
  Sparkles,
  Stethoscope
} from 'lucide-react'
import type { Doctor, Weekday } from '@/lib/data/types'
import { money } from '@/lib/format'

const WEEK_DAYS: { key: Weekday; label: string; full: string }[] = [
  { key: 'Sun', label: 'S', full: 'Sunday' },
  { key: 'Mon', label: 'M', full: 'Monday' },
  { key: 'Tue', label: 'T', full: 'Tuesday' },
  { key: 'Wed', label: 'W', full: 'Wednesday' },
  { key: 'Thu', label: 'T', full: 'Thursday' },
  { key: 'Fri', label: 'F', full: 'Friday' },
  { key: 'Sat', label: 'S', full: 'Saturday' },
]

// Fallback images map for doctor IDs
const DOCTOR_IMAGES: Record<string, string> = {
  doc_01: '/images/doctors/doc_01.jpg',
  doc_02: '/images/doctors/doc_02.jpg',
  doc_03: '/images/doctors/doc_03.jpg',
  doc_04: '/images/doctors/doc_04.jpg',
  doc_05: '/images/doctors/doc_05.jpg',
  doc_06: '/images/doctors/doc_06.jpg',
  doc_07: '/images/doctors/doc_07.jpg',
  doc_08: '/images/doctors/doc_08.jpg',
}

interface DoctorRailProps {
  doctors: Doctor[]
}

// 4 repeated sets to guarantee seamless infinite wrapping buffer
const REPEAT_COUNT = 4

export function DoctorRail({ doctors }: DoctorRailProps) {
  const doctorList = doctors.length > 0 ? doctors : []
  const count = doctorList.length

  const [activeDoctorIdx, setActiveDoctorIdx] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isUserDragging, setIsUserDragging] = useState(false)

  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const firstSetRef = useRef<HTMLDivElement>(null)

  // Infinite Scroll State Refs for 60fps RAF loop
  const posRef = useRef(0)
  const targetPosRef = useRef(0)
  const singleSetWidthRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartPosRef = useRef(0)
  const lastDragXRef = useRef(0)
  const lastDragTimeRef = useRef(0)
  const dragVelocityRef = useRef(0)
  const hasMovedRef = useRef(false)
  const isHoveredRef = useRef(false)
  const animationFrameId = useRef<number | null>(null)
  const isInitializedRef = useRef(false)

  // Update hover ref
  useEffect(() => {
    isHoveredRef.current = isHovered
  }, [isHovered])

  // Measure single set width
  const measureSetWidth = useCallback(() => {
    if (!firstSetRef.current) return
    const width = firstSetRef.current.offsetWidth
    if (width > 0) {
      singleSetWidthRef.current = width
      if (!isInitializedRef.current) {
        // Start centered in the 2nd duplicate set so user can scroll left or right seamlessly
        posRef.current = -width
        targetPosRef.current = -width
        isInitializedRef.current = true
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-width}px, 0, 0)`
        }
      }
    }
  }, [])

  useEffect(() => {
    measureSetWidth()
    const handleResize = () => {
      measureSetWidth()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [measureSetWidth, count])

  // Continuous animation and momentum loop
  useEffect(() => {
    let lastTime = performance.now()

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      const setWidth = singleSetWidthRef.current

      if (setWidth > 0) {
        // Apply friction when dragging with momentum
        if (!isDraggingRef.current && Math.abs(dragVelocityRef.current) > 0.5) {
          targetPosRef.current += dragVelocityRef.current * dt * 60
          dragVelocityRef.current *= 0.92
        }

        // Smoothly interpolate current position toward target position
        if (!isDraggingRef.current) {
          posRef.current += (targetPosRef.current - posRef.current) * 0.1
        }

        // Seamless infinite wrap check
        // We have REPEAT_COUNT sets (0, 1, 2, 3)
        // Keep posRef centered around set 1 to 2 (-setWidth to -setWidth * 2)
        while (posRef.current <= -setWidth * 2) {
          posRef.current += setWidth
          targetPosRef.current += setWidth
        }
        while (posRef.current > -setWidth) {
          posRef.current -= setWidth
          targetPosRef.current -= setWidth
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${posRef.current}px, 0, 0)`
        }

        // Calculate visible doctor index for indicator dots
        if (count > 0) {
          const cardApproxWidth = setWidth / count
          const normalized = ((-posRef.current - setWidth + (window.innerWidth / 2) - (cardApproxWidth / 2)) % setWidth + setWidth) % setWidth
          const currentIdx = Math.floor(normalized / cardApproxWidth) % count
          setActiveDoctorIdx(currentIdx)
        }
      }

      animationFrameId.current = requestAnimationFrame(loop)
    }

    animationFrameId.current = requestAnimationFrame(loop)
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [count])

  // Mouse wheel horizontal scrolling handler (ignores vertical page scroll up/down)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Only handle intentional horizontal scrolling (e.g. trackpad horizontal swipe or Shift+Wheel)
      // Never move carousel or block page when scrolling up and down
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 1) {
        e.preventDefault()
        targetPosRef.current -= e.deltaX * 1.5
        dragVelocityRef.current = 0
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Mouse Drag / Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button
    if (e.button !== 0) return
    isDraggingRef.current = true
    setIsUserDragging(true)
    hasMovedRef.current = false
    dragStartXRef.current = e.clientX
    dragStartPosRef.current = posRef.current
    lastDragXRef.current = e.clientX
    lastDragTimeRef.current = performance.now()
    dragVelocityRef.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const deltaX = e.clientX - dragStartXRef.current
    if (Math.abs(deltaX) > 6) {
      hasMovedRef.current = true
    }

    posRef.current = dragStartPosRef.current + deltaX
    targetPosRef.current = posRef.current

    // Calculate instant velocity for momentum flick
    const now = performance.now()
    const dt = now - lastDragTimeRef.current
    if (dt > 10) {
      dragVelocityRef.current = (e.clientX - lastDragXRef.current) / (dt / 16.6)
      lastDragXRef.current = e.clientX
      lastDragTimeRef.current = now
    }
  }

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsUserDragging(false)
  }

  // Prev / Next button handlers
  const handlePrev = () => {
    const setWidth = singleSetWidthRef.current
    const step = count > 0 ? setWidth / count : 350
    targetPosRef.current += step
    dragVelocityRef.current = 0
  }

  const handleNext = () => {
    const setWidth = singleSetWidthRef.current
    const step = count > 0 ? setWidth / count : 350
    targetPosRef.current -= step
    dragVelocityRef.current = 0
  }

  // Jump to specific index in infinite rail
  const handleDotClick = (targetIndex: number) => {
    const setWidth = singleSetWidthRef.current
    if (count === 0 || setWidth === 0) return
    const cardWidth = setWidth / count
    const currentModulo = activeDoctorIdx
    let diff = targetIndex - currentModulo
    if (diff > count / 2) diff -= count
    if (diff < -count / 2) diff += count
    targetPosRef.current -= diff * cardWidth
  }

  return (
    <section 
      ref={sectionRef} 
      id="doctors" 
      className="relative w-full overflow-hidden py-20 sm:py-28"
    >
      {/* Background Decorative Ambient Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-96 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-200/30 via-purple-100/20 to-transparent blur-3xl dark:from-indigo-900/20 dark:via-purple-900/10" />

      {/* Header Section */}
      <div className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Meet our expert doctors
            </h2>
            <p className="mt-3 max-w-xl text-sm text-ink-soft sm:text-base">
              Explore our team of board-certified specialists with real-time consultation rosters.
            </p>
          </div>

          {/* Top Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label="Previous doctor"
              className="flex size-10 items-center justify-center rounded-full border border-line bg-surface shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-surface-strong hover:text-accent active:scale-95 text-ink cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next doctor"
              className="flex size-10 items-center justify-center rounded-full border border-line bg-surface shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-surface-strong hover:text-accent active:scale-95 text-ink cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-Width Doctor Cards Infinite Carousel Rail */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          if (isDraggingRef.current) {
            isDraggingRef.current = false
            setIsUserDragging(false)
          }
        }}
        className={`relative w-full overflow-hidden select-none touch-pan-y ${
          isUserDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Subtle Edge Fade Gradients for Seamless Visual Bleed */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16 bg-gradient-to-r from-bg via-bg/40 to-transparent dark:from-[#0b0f19] dark:via-[#0b0f19]/40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16 bg-gradient-to-l from-bg via-bg/40 to-transparent dark:from-[#0b0f19] dark:via-[#0b0f19]/40" />

        {/* Sliding Infinite Track */}
        <div
          ref={trackRef}
          className="flex items-stretch py-6"
          style={{ 
            willChange: 'transform',
            width: 'max-content'
          }}
        >
          {Array.from({ length: REPEAT_COUNT }).map((_, setIdx) => (
            <div
              key={`set-${setIdx}`}
              ref={setIdx === 0 ? firstSetRef : undefined}
              className="flex items-stretch gap-5 px-2.5 sm:gap-7 sm:px-3.5"
            >
              {doctorList.map((doc, docIdx) => {
                const imageSrc = DOCTOR_IMAGES[doc.id] || '/images/doctors/doc_01.jpg'
                const docFirstName = doc.name.replace(/^Dr\.\s+/i, '').split(' ')[0]
                const isCurrentActive = docIdx === activeDoctorIdx

                return (
                  <div
                    key={`${setIdx}-${doc.id}`}
                    onClick={(e) => {
                      // Prevent clicking during drag
                      if (hasMovedRef.current) {
                        e.preventDefault()
                        e.stopPropagation()
                        return
                      }
                      handleDotClick(docIdx)
                    }}
                    className={`group relative flex w-[280px] shrink-0 flex-col justify-between rounded-[30px] p-3.5 transition-all duration-300 sm:w-[330px] sm:p-4.5 ${
                      isCurrentActive
                        ? 'bg-gradient-to-b from-[#fce7f3] via-[#e0e7ff] to-[#c7d2fe] ring-2 ring-indigo-400/40 shadow-xl shadow-indigo-500/10 dark:from-[#3b1f3c] dark:via-[#1e1b4b] dark:to-[#172554] dark:ring-indigo-500/40 scale-[1.02] -translate-y-1'
                        : 'bg-[#f1f3f6] border border-black/5 hover:bg-[#eaeef3] dark:bg-[#141926]/90 dark:border-white/10 dark:hover:bg-[#1a2233] hover:scale-[1.01]'
                    }`}
                  >
                    {/* Featured Doctor Badge on Active Card */}
                    {isCurrentActive && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1 text-[0.7rem] font-semibold tracking-wide text-white shadow-md shadow-indigo-500/30">
                        <Stethoscope className="size-3" />
                        <span>FEATURED DOCTOR</span>
                      </div>
                    )}

                    {/* Doctor Portrait Section */}
                    <div className="relative mx-auto flex h-[260px] w-full items-end justify-center overflow-hidden rounded-[24px] sm:h-[300px]">
                      {/* Soft background glow inside the frame */}
                      <div 
                        className={`absolute inset-0 rounded-[24px] transition-opacity ${
                          isCurrentActive 
                            ? 'bg-gradient-to-b from-white/30 to-transparent' 
                            : 'bg-gradient-to-b from-black/[0.02] to-black/[0.06] dark:from-white/[0.02] dark:to-white/[0.06]'
                        }`} 
                      />

                      {/* Rating Pill */}
                      <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[0.75rem] font-semibold text-ink shadow-sm backdrop-blur-md dark:bg-black/80 dark:text-white">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{doc.rating.toFixed(1)}</span>
                      </div>

                      {/* Doctor Image with smooth zoom on hover */}
                      <div className="relative h-full w-full">
                        <Image
                          src={imageSrc}
                          alt={doc.name}
                          fill
                          sizes="(max-width: 640px) 280px, 330px"
                          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                          priority={setIdx === 1 && docIdx < 4}
                        />
                      </div>
                    </div>

                    {/* Docked Details Section */}
                    <div className="relative mt-3.5 flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-sm transition-all dark:bg-[#111622] sm:p-4.5">
                      {/* Doctor Name & Specialty */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate font-display text-base font-bold tracking-tight text-ink sm:text-[1.12rem]">
                            {doc.name}
                          </h3>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-ink-soft">
                          {doc.specialty}
                        </p>
                      </div>

                      {/* Schedule Section */}
                      <div className="flex flex-col gap-2.5 border-t border-line/60 pt-2.5">
                        {/* Section label and hours */}
                        <div className="flex items-center justify-between text-[0.72rem] font-medium text-ink-soft">
                          <span className="flex items-center gap-1.5 font-semibold text-ink">
                            <Calendar className="size-3.5 text-accent" />
                            <span>Weekly Schedule</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[0.68rem] text-ink-faint">
                            <Clock className="size-3" />
                            <span>{doc.slots[0] || '09:00'} - {doc.slots[doc.slots.length - 1] || '17:00'}</span>
                          </span>
                        </div>

                        {/* Day Bubbles */}
                        <div className="flex items-center justify-between gap-1">
                          {WEEK_DAYS.map((day) => {
                            const sits = doc.availableDays.includes(day.key)
                            return (
                              <div
                                key={day.key}
                                title={`${day.full}: ${sits ? 'Sitting & Available' : 'Off'}`}
                                className={`flex size-7 sm:size-7.5 items-center justify-center rounded-full text-[0.68rem] font-semibold transition-all ${
                                  sits
                                    ? isCurrentActive
                                      ? 'bg-ink text-surface-solid shadow-sm scale-105 dark:bg-accent dark:text-white'
                                      : 'bg-ink/90 text-white dark:bg-white/90 dark:text-ink'
                                    : 'bg-black/[0.04] text-ink-faint/60 dark:bg-white/[0.05] dark:text-ink-faint/40'
                                }`}
                              >
                                <span>{day.label}</span>
                              </div>
                            )
                          })}
                        </div>

                        {/* Action & Fee Details */}
                        <div className="mt-1 flex items-center justify-between gap-2 pt-1">
                          <div className="flex flex-col">
                            <span className="text-[0.62rem] uppercase tracking-wider text-ink-faint font-semibold">Consultation</span>
                            <span className="font-mono text-xs font-bold text-ink">{money(doc.consultationFee)}</span>
                          </div>

                          <Link
                            href={`/appointments?doctorId=${doc.id}`}
                            onClick={(e) => {
                              if (hasMovedRef.current) {
                                e.preventDefault()
                                e.stopPropagation()
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                              isCurrentActive
                                ? 'bg-accent text-accent-ink shadow-sm hover:bg-accent-hover active:scale-95'
                                : 'border border-line bg-surface-strong text-ink hover:border-accent/40 hover:text-accent'
                            }`}
                          >
                            <span>Book with {docFirstName}</span>
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Indicator Dots and Controls */}
      <div className="mx-auto mt-6 flex max-w-7xl items-center justify-center gap-3 px-4">
        <button
          onClick={handlePrev}
          aria-label="Previous doctor"
          className="flex size-8 items-center justify-center rounded-full border border-line bg-surface text-ink transition-transform hover:scale-105 active:scale-95 sm:hidden"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {doctorList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to doctor ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeDoctorIdx
                  ? 'w-7 bg-accent'
                  : 'w-2 bg-line hover:bg-ink-faint/50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          aria-label="Next doctor"
          className="flex size-8 items-center justify-center rounded-full border border-line bg-surface text-ink transition-transform hover:scale-105 active:scale-95 sm:hidden"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  )
}
