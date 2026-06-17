'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from './gsap-config'

interface ScrollRevealOptions {
  direction?: 'up' | 'left' | 'right'
  delay?: number
  stagger?: number
  threshold?: number
}

export default function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {}
) {
  const {
    direction = 'up',
    delay = 0,
    stagger = 0.12,
    threshold = 0.85,
  } = options

  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const fromX = direction === 'left' ? -40 : direction === 'right' ? 40 : 0
    const fromY = direction === 'up' ? 40 : 0

    const ctx = gsap.context(() => {
      const hasChildren = el.children.length > 0
      const targets = hasChildren ? Array.from(el.children) : el

      gsap.fromTo(
        targets,
        { opacity: 0, x: fromX, y: fromY },
        {
          opacity: 1,
          x: 0,
          y: 0,
          stagger: hasChildren ? stagger : undefined,
          delay,
          scrollTrigger: {
            trigger: el,
            start: `top ${threshold * 100}%`,
            toggleActions: 'play none none none',
          },
        }
      )
    }, el)

    return () => {
      ctx.revert()
    }
  }, [direction, delay, stagger, threshold])

  return ref
}
