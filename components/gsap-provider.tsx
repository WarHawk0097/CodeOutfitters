'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap-setup'

export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    const lenisHandler = (time: number) => { lenis.raf(time * 1000) }

    gsap.ticker.add(lenisHandler)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement
      if (!target.hash?.startsWith('#')) return
      const el = document.getElementById(target.hash.slice(1))
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -80 })
    }

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
    anchors.forEach((a) => a.addEventListener('click', handleAnchorClick as EventListener))

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
      gsap.ticker.remove(lenisHandler)
      lenis.destroy()
      anchors.forEach((a) => a.removeEventListener('click', handleAnchorClick as EventListener))
    }
  }, [])

  return <>{children}</>
}
