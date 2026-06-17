'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

gsap.defaults({
  duration: 0.8,
  ease: 'power3.out',
})

if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(0)
  ScrollTrigger.normalizeScroll(false)
}

export { gsap, ScrollTrigger }
