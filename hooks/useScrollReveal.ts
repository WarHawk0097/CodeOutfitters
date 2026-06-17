'use client'
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap-setup'

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(stagger = 0.12) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger,
          clearProps: 'willChange',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [stagger])

  return ref
}
