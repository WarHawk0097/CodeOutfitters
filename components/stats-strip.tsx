'use client'

import { useMotionMode } from '@/components/motion-mode-provider'
import { useState, useEffect, useRef } from 'react'

const stats = [
  { target: 50, suffix: 'K+', label: 'hours automated for clients', color: '#2BD483', format: (n: number) => Math.round(n) + 'K+' },
  { target: 120, suffix: '+', label: 'automations shipped', color: '#F5F0E8', format: (n: number) => Math.round(n) + '+' },
  { target: 12, suffix: '', label: 'industries served', color: '#F5F0E8', format: (n: number) => Math.round(n) + '' },
  { target: 98, suffix: '%', label: 'client retention', color: '#D9B36A', format: (n: number) => Math.round(n) + '%' },
]

function CountUpStat({ stat, shouldAnimate }: { stat: typeof stats[number]; shouldAnimate: boolean }) {
  const [display, setDisplay] = useState(stat.format(0))
  const rafRef = useRef<number>(0)
  const animated = useRef(false)

  useEffect(() => {
    if (!shouldAnimate || animated.current) {
      if (shouldAnimate) setDisplay(stat.format(stat.target))
      return
    }
    animated.current = true
    const duration = 1300
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(stat.format(stat.target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [shouldAnimate, stat])

  return (
    <span style={{ font: '600 clamp(28px,3vw,40px)/1 "Space Grotesk",sans-serif', color: stat.color, letterSpacing: '-.02em' }}>
      {display}
    </span>
  )
}

export function StatsStrip() {
  const { reduced } = useMotionMode()
  const [revealed, setRevealed] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduced) { setRevealed(true); return }
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect() }
    }, { threshold: 0.08 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      style={{ background: '#0A120E', borderTop: '1px solid rgba(255,255,255,.07)' }}
    >
      <div
        style={{
          maxWidth: '1180px',
          marginInline: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
          gap: '1px',
          background: 'rgba(255,255,255,.09)',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#0A120E',
              padding: '30px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              textAlign: 'center',
            }}
          >
            <CountUpStat stat={stat} shouldAnimate={revealed} />
            <span style={{ font: '500 13.5px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.55)' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
