'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// registerPlugin is idempotent, and this module evaluates once per bundle.
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
