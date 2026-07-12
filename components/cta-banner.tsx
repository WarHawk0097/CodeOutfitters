'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function CTABanner() {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.12)

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      aria-label="Call to action"
      style={{ background: '#0A120E' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(760px 420px at 50% -15%, rgba(23,160,99,.18), transparent 62%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div
          className="cta-v7"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,.9fr)',
            gap: 'clamp(28px,4vw,56px)',
            alignItems: 'center',
            maxWidth: '1060px',
            margin: '0 auto',
            background: 'linear-gradient(160deg,#10301F,#0A1C12)',
            border: '1px solid rgba(255,253,246,.14)',
            borderRadius: '28px',
            padding: 'clamp(26px,4.5vw,54px)',
            boxShadow: '0 44px 100px rgba(0,0,0,.45)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '18px', minWidth: 0 }}>
            <span
              style={{
                font: '700 12px "Instrument Sans",sans-serif',
                letterSpacing: '.18em',
                color: '#D9B36A',
                textTransform: 'uppercase',
              }}
            >
              Let&apos;s talk
            </span>

            <h2
              className="cta-title-v7"
              style={{
                margin: 0,
                font: '600 clamp(30px,3.8vw,46px)/1.12 "Space Grotesk",sans-serif',
                color: '#F5F0E8',
                letterSpacing: '-.02em',
                overflowWrap: 'normal',
                wordBreak: 'normal',
              }}
            >
              Book a <span style={{ whiteSpace: 'nowrap' }}>Discovery Call</span>
            </h2>

            <p
              style={{
                margin: 0,
                font: '400 17px/1.65 "Instrument Sans",sans-serif',
                color: 'rgba(245,240,232,.62)',
                maxWidth: '440px',
              }}
            >
              30 minutes. No sales pressure. We map your biggest time drains and show you exactly what
              automation looks like for your business — free.
            </p>

            <div className="cta-chip-row-v7" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { label: 'Free audit included' },
                { label: 'No long contracts' },
                { label: '30-day support' },
              ].map((item) => (
                <span
                  key={item.label}
                  className="cta-chip-v7"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    font: '600 13.5px/1.4 "Instrument Sans",sans-serif',
                    color: 'rgba(245,240,232,.78)',
                    background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.14)',
                    borderRadius: '999px',
                    padding: '9px 15px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: '#2BD483' }}>✓</span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="cta-action-card-v7"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(255,255,255,.04)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '20px',
              padding: 'clamp(20px,2.6vw,30px)',
              minWidth: 0,
            }}
          >
            <span
              style={{
                font: '700 10.5px "Instrument Sans",sans-serif',
                letterSpacing: '.14em',
                color: 'rgba(245,240,232,.5)',
                textTransform: 'uppercase',
              }}
            >
              What you get in 30 minutes
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {[
                'A map of your biggest time drains',
                'An honest automation-fit assessment',
                'A fixed quote — before we build anything',
              ].map((text) => (
                <span
                  key={text}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    font: '500 14.5px/1.5 "Instrument Sans",sans-serif',
                    color: 'rgba(245,240,232,.8)',
                  }}
                >
                  <span style={{ color: '#2BD483', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {text}
                </span>
              ))}
            </div>

            <Link
              href="/contact"
              className="cta-sweep"
              style={{
                whiteSpace: 'nowrap',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                marginTop: '4px',
                font: '600 16px "Instrument Sans",sans-serif',
                color: '#0A120E',
                background: 'linear-gradient(160deg,#E7C57E,#D9B36A)',
                border: 'none',
                borderRadius: '13px',
                padding: '17px 20px',
                cursor: 'pointer',
                textDecoration: 'none',
                boxShadow: '0 16px 40px rgba(217,179,106,.3), inset 0 1px 0 rgba(255,255,255,.4)',
                overflow: 'hidden',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>Book Free Discovery Call</span>
              <ArrowRight className="w-[15px] h-[15px] flex-shrink-0" />
            </Link>

            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                font: '600 13px "Instrument Sans",sans-serif',
                color: '#D9B36A',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#D9B36A',
                  flexShrink: 0,
                }}
              />
              3 build slots left for July
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
