'use client'

import { useRef, useState } from 'react'

const tools = [
  'n8n', 'Make', 'Zapier', 'Airtable', 'Google Sheets', 'Slack',
  'HubSpot', 'Notion', 'WhatsApp', 'Shopify', 'Stripe', 'Calendly',
]

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function ToolChip({ name }: { name: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: '999px',
        padding: '8px 20px 8px 9px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          background: '#F5F0E8',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src={`/assets/integrations/${slug(name)}.svg`}
          alt={name}
          width={22}
          height={22}
          style={{ objectFit: 'contain', display: 'block' }}
        />
      </div>
      <span style={{ font: '600 14px "Instrument Sans",sans-serif', color: '#F5F0E8' }}>
        {name}
      </span>
    </div>
  )
}

function MarqueeRow({ dir, children }: { dir: 'left' | 'right'; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`marquee-overflow marquee-${dir}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
      }}
    >
      <div
        ref={rowRef}
        className="marquee-track"
        style={{
          display: 'flex',
          gap: '14px',
          width: 'fit-content',
          animation: `marquee-${dir} 38s linear infinite`,
          animationPlayState: hovered ? 'paused' : 'running',
        }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

export function ToolsMarquee() {
  return (
    <section style={{ background: '#0E241A', padding: '60px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <h2
          style={{
            font: '600 12px "Instrument Sans",sans-serif',
            letterSpacing: '.22em',
            color: 'rgba(245,240,232,.45)',
            textTransform: 'uppercase',
            margin: '0 0 32px',
          }}
        >
          Powered by industry-leading AI infrastructure
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <MarqueeRow dir="left">
          {tools.map((t) => (
            <ToolChip key={t} name={t} />
          ))}
        </MarqueeRow>
        <MarqueeRow dir="right">
          {tools.map((t) => (
            <ToolChip key={t} name={t} />
          ))}
        </MarqueeRow>
      </div>

      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </section>
  )
}
