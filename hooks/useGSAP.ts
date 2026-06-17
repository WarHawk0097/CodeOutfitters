'use client'
import { useEffect, useRef } from 'react'

export function useGSAP(stagger = 0.15) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ctx: any

    const init = async () => {
      const { gsap } = await import('gsap')
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      if (!ref.current) return

      const items = ref.current.querySelectorAll('[data-gsap]')
      if (!items.length) return

      ctx = gsap.context(() => {
        items.forEach((el, i) => {
          gsap.fromTo(el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              delay: i * stagger,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                toggleActions: 'play none none none',
              }
            }
          )
        })
      }, ref)
    }

    const timer = setTimeout(init, 100)
    return () => {
      clearTimeout(timer)
      ctx?.revert()
    }
  }, [stagger])

  return ref
}
