'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/animations/gsap-setup'
import { useMotionMode } from '@/components/motion-mode-provider'

export function useParallaxFloat<T extends HTMLElement>(strength = 15) {
  const ref = useRef<T>(null)
  const { reduced } = useMotionMode()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / window.innerWidth
      const dy = (e.clientY - cy) / window.innerHeight

      gsap.to(el, {
        rotateY: dx * strength,
        rotateX: -dy * strength,
        x: dx * strength * 0.4,
        y: dy * strength * 0.3,
        duration: 0.6,
        ease: 'power2.out',
        transformPerspective: 1200,
      })
    }

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength, reduced])

  return ref
}
