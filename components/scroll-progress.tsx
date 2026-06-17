'use client'
import { useEffect, useRef } from 'react'

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateProgress = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrolled / total) * 100
      if (bar.current) bar.current.style.width = `${progress}%`
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-transparent">
      <div
        ref={bar}
        className="h-full rounded-full transition-none"
        style={{
          background: 'linear-gradient(90deg, #2A6B5A, #2A6B5A)',
          width: '0%'
        }}
      />
    </div>
  )
}
