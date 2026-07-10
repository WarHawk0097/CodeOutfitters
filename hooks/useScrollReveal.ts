'use client'
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap-setup'

type RevealDir = 'up' | 'down' | 'left' | 'right' | 'scale'

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(opts?: number | { stagger?: number; dir?: RevealDir }) {
  const ref = useRef<T>(null)
  const stagger = typeof opts === 'number' ? opts : opts?.stagger ?? 0.12
  const dir: RevealDir = typeof opts === 'object' ? opts.dir ?? 'up' : 'up'

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) return

    const fromVars: gsap.TweenVars = { opacity: 0 }
    const toVars: gsap.TweenVars = { opacity: 1, duration: 0.9, ease: 'power3.out', stagger, clearProps: 'willChange' }

    if (dir === 'scale') {
      fromVars.scale = 0.88
      toVars.scale = 1
    } else {
      const dist = 52
      if (dir === 'up') fromVars.y = dist
      else if (dir === 'down') fromVars.y = -dist
      else if (dir === 'left') fromVars.x = dist
      else if (dir === 'right') fromVars.x = -dist
      toVars.y = 0; toVars.x = 0
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, fromVars, { ...toVars, scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' } })
    }, el)

    return () => ctx.revert()
  }, [stagger, dir])

  return ref
}
