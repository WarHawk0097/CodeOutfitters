'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

const stats = [
  { value: '50K+', label: 'hours automated for clients', color: '#2BD483' },
  { value: '120+', label: 'automations shipped', color: '#F5F0E8' },
  { value: '12', label: 'industries served', color: '#F5F0E8' },
  { value: '98%', label: 'client retention', color: '#D9B36A' },
]

export function StatsStrip() {
  const ref = useScrollReveal<HTMLElement>(0.08)

  return (
    <section
      ref={ref}
      style={{ background: '#0A120E', borderTop: '1px solid rgba(255,255,255,.07)' }}
    >
      <div className="hp-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1px',
          background: 'rgba(255,255,255,.07)',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            data-reveal
            style={{
              background: '#0A120E',
              padding: '30px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                font: '600 clamp(28px,3vw,40px)/1 "Space Grotesk",sans-serif',
                color: stat.color,
                marginBottom: '6px',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                font: '500 13.5px "Instrument Sans",sans-serif',
                color: 'rgba(245,240,232,.55)',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:600px){.hp-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}`}</style>
    </section>
  )
}
