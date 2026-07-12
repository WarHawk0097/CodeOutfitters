'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const featuredTestimonials = [
  {
    text: 'The automation systems have helped our team reduce manual follow-ups significantly. The WhatsApp bot ensures no lead goes unanswered, even after hours.',
    handle: '— Owner, real estate agency',
    result: 'Faster lead response',
  },
  {
    text: 'Invoice processing that used to take hours now happens automatically. The team can focus on actual client work instead of data entry.',
    handle: '— Operations manager, e-commerce brand',
    result: 'Reduced manual data entry',
  },
  {
    text: 'Automated appointment booking cut our phone call volume substantially. Patients appreciate being able to book 24/7 without waiting on hold.',
    handle: '— Practice director, healthcare clinic',
    result: '24/7 self-service booking',
  },
]

const marqueeTestimonials = [
  'Setup was seamless — they handled everything end to end.',
  'Response times improved dramatically after the automation went live.',
  'The ROI was clear within the first month of using the system.',
  'They took the time to understand our actual workflow before building anything.',
  'No coding required on our end. They integrated with our existing tools.',
  'Leads that used to slip through after hours are now captured automatically.',
  'The 7-day timeline was accurate — they delivered exactly when promised.',
  'Support volume is more manageable now that common questions are handled automatically.',
  'They found automation opportunities we had not considered ourselves.',
  'The documentation was clear and the handoff was smooth.',
  'The time savings have been significant — we can redirect focus to growth.',
  'Post-launch support has been responsive whenever we had questions.',
]

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
      <span style={{ width: '40px', height: '1px', background: '#D9B36A', flexShrink: 0 }} />
      <span style={{ font: '700 11.5px "Instrument Sans",sans-serif', letterSpacing: '.18em', color: '#D9B36A', textTransform: 'uppercase' }}>
        {text}
      </span>
      <span style={{ width: '40px', height: '1px', background: '#D9B36A', flexShrink: 0 }} />
    </div>
  )
}

function MarqueeRow({ dir, items }: { dir: 'left' | 'right'; items: string[] }) {
  return (
    <div
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent)',
      }}
    >
      <motion.div
        style={{ display: 'flex', gap: '12px', width: 'fit-content' }}
        animate={{ x: dir === 'left' ? [0, -900] : [-900, 0] }}
        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
      >
        {items.map((text, i) => (
          <div key={i}
            style={{
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '18px', padding: '16px 20px', width: '280px', flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} size={11} color="#D9B36A" fill="#D9B36A" />
              ))}
            </div>
            <p style={{ font: '400 12.5px/1.5 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.7)', margin: 0, fontStyle: 'italic' }}>
              &ldquo;{text}&rdquo;
            </p>
          </div>
        ))}
        {items.map((text, i) => (
          <div key={`dup-${i}`}
            style={{
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '18px', padding: '16px 20px', width: '280px', flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} size={11} color="#D9B36A" fill="#D9B36A" />
              ))}
            </div>
            <p style={{ font: '400 12.5px/1.5 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.7)', margin: 0, fontStyle: 'italic' }}>
              &ldquo;{text}&rdquo;
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function Testimonials() {
  const [current, setCurrent] = useState(0)
  const sectionRef = useScrollReveal<HTMLElement>(0.08)

  useEffect(() => {
    const i = setInterval(() => {
      setCurrent((c) => (c + 1) % featuredTestimonials.length)
    }, 5200)
    return () => clearInterval(i)
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#0A120E',
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <SectionLabel text="05 · Client love" />
          <h2
            style={{
              font: '600 clamp(28px,3.8vw,42px)/1.15 "Space Grotesk",sans-serif',
              color: '#F5F0E8',
              letterSpacing: '-.02em',
            }}
          >
            What teams value in an automation partner
          </h2>
        </div>

        <div style={{ maxWidth: '700px', margin: '0 auto 48px', position: 'relative', minHeight: '200px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.10)',
                borderRadius: '20px',
                padding: '28px 32px',
              }}
            >
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} color="#D9B36A" fill="#D9B36A" />
                ))}
              </div>
              <blockquote
                style={{
                  font: '400 17px/1.7 "Instrument Sans",sans-serif',
                  color: 'rgba(245,240,232,.8)',
                  margin: '0 0 20px',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{featuredTestimonials[current].text}&rdquo;
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ font: '400 13px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.55)' }}>
                  {featuredTestimonials[current].handle}
                </div>
                <span
                  style={{
                    font: '700 11px "Instrument Sans",sans-serif',
                    color: '#2BD483',
                    background: 'rgba(43,212,131,.10)',
                    border: '1px solid rgba(43,212,131,.25)',
                    borderRadius: '999px',
                    padding: '5px 13px',
                  }}
                >
                  {featuredTestimonials[current].result}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {featuredTestimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: i === current ? '#D9B36A' : 'rgba(255,255,255,.15)',
                  transition: 'all .3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <MarqueeRow dir="left" items={marqueeTestimonials.slice(0, 6)} />
          <MarqueeRow dir="right" items={marqueeTestimonials.slice(6)} />
        </div>
      </div>
    </section>
  )
}
