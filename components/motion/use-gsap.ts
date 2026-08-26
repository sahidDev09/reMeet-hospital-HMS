'use client'

import { useEffect, useLayoutEffect, useRef, type DependencyList } from 'react'
import { gsap } from './gsap'

/** useLayoutEffect on the client, useEffect on the server — avoids React's SSR warning. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Scoped GSAP with correct teardown.
 *
 * Runs in a layout effect so `gsap.from()` sets the start state before paint —
 * no flash of the final layout. Everything is built inside a `gsap.context`
 * scoped to the returned ref, so `ctx.revert()` fully restores the DOM on
 * unmount and across React 19 StrictMode's double-mount.
 *
 * Bails out entirely under prefers-reduced-motion, which leaves the markup in
 * its natural, fully-visible state.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  effect: (el: T, ctx: gsap.Context) => void,
  deps: DependencyList = [],
) {
  const scope = useRef<T>(null)

  useIsomorphicLayoutEffect(() => {
    const el = scope.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context((self) => effect(el, self), scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}
