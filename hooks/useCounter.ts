'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap-setup'
import { useMotionMode } from '@/components/motion-mode-provider'

export function useCounter<T extends HTMLElement = HTMLDivElement>(end: number, duration = 1.8) {
  const ref = useRef<T>(null)
  const [val, setVal] = useState(0)
  const { reduced } = useMotionMode()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) { setVal(end); return }
    if (end === 0) return

    const ctx = gsap.context(() => {
      const obj = { v: 0 }
      gsap.to(obj, {
        v: end, duration, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        onUpdate: () => setVal(Math.round(obj.v)),
      })
    }, el)

    return () => ctx.revert()
  }, [end, duration, reduced])

  return { ref, val }
}
