'use client'

import { useState, useRef } from 'react'

const tools = [
  'n8n', 'Make', 'Zapier', 'Airtable', 'Google Sheets', 'Slack',
  'HubSpot', 'Notion', 'WhatsApp', 'Shopify', 'Stripe', 'Calendly',
]

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function ToolChip({ name }: { name: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '11px',
      background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
      borderRadius: '999px', padding: '8px 20px 8px 9px', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{
        width: '34px', height: '34px', borderRadius: '9px',
        background: '#F5F0E8', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
      }}>
        <img src={`/assets/integrations/${slug(name)}.svg`} alt={name}
          width={22} height={22} style={{ objectFit: 'contain', display: 'block' }} />
      </span>
      <span style={{ font: '600 14px "Instrument Sans",sans-serif', color: '#F5F0E8' }}>{name}</span>
    </span>
  )
}

export function ToolsMarquee() {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <section style={{ background: '#0E241A', padding: '60px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{
          font: '600 12px "Instrument Sans",sans-serif', letterSpacing: '.22em',
          color: 'rgba(245,240,232,.45)', textTransform: 'uppercase', margin: '0 0 32px',
        }}>
          Powered by industry-leading AI infrastructure
        </h2>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div ref={ref}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex', gap: '14px', width: 'max-content',
            animation: hovered ? 'none' : 'marqueeL 38s linear infinite',
          }}
        >
          {tools.map((t) => <ToolChip key={t} name={t} />)}
          {tools.map((t) => <ToolChip key={`dup-${t}`} name={t} />)}
        </div>
      </div>

      <div className="marquee-static-fallback" style={{ display: 'none' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', padding: '0 24px' }}>
          {tools.map((t) => <ToolChip key={t} name={t} />)}
        </div>
      </div>

      <style>{`
        @keyframes marqueeL {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-static-fallback { display: flex !important; }
          div[style*="animation: marqueeL"] { display: none !important; }
        }
      `}</style>
    </section>
  )
}
