'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const featuredTestimonials = [
  {
    name: 'Marcus T.',
    role: 'Owner, Sunrise Realty · Austin, TX',
    text: 'We were losing leads every weekend when the office was closed. CodeOutfitters built a WhatsApp bot that now qualifies and responds to every inquiry instantly. We closed 3 deals last month that we would have lost before.',
    stars: 5,
    result: '3 extra deals closed',
  },
  {
    name: 'Jennifer K.',
    role: 'Operations Mgr, FreshBite Co. · Chicago, IL',
    text: 'Invoice processing was killing us — 4 hours a day just entering data. The automation they built handles 200+ orders daily with zero errors. My team finally focuses on actual work.',
    stars: 5,
    result: '20+ hrs reclaimed weekly',
  },
  {
    name: 'Dr. Samuel R.',
    role: 'Practice Director, ClearView Clinic · Miami, FL',
    text: 'The appointment bot cut our phone calls by 90%. Patients love booking 24/7. No-shows dropped 40% because of the automated reminders. Setup was done in 5 days exactly as promised.',
    stars: 5,
    result: '90% fewer phone calls',
  },
]

const marqueeTestimonials = [
  { name: 'Lisa M.', text: 'Setup was seamless. They handled everything — I just showed them how we work and it was live in 6 days.' },
  { name: 'Tom K.', text: 'Our response time went from 4 hours to 12 seconds. Clients keep asking what we changed.' },
  { name: 'Rachel S.', text: 'I was skeptical but the ROI was clear in the first month. We have saved 60+ hours already.' },
  { name: 'David P.', text: 'The team actually understood our business. Not just tech — they got the workflow.' },
  { name: 'Amanda W.', text: 'Zero coding on our end. They integrated with our legacy CRM without a single issue.' },
  { name: 'James R.', text: 'We used to lose leads after hours. Now our WhatsApp bot catches every single one.' },
  { name: 'Sophia L.', text: 'The 7-day timeline seemed impossible. They shipped in 5. Absolute pros.' },
  { name: 'Michael B.', text: 'Our support team handles 3x the volume without hiring. Game changer.' },
  { name: 'Emma D.', text: 'They found automations I didn\'t even know were possible. Worth every penny.' },
  { name: 'Chris N.', text: 'Onboarding was quick, the documentation was clear, and the results speak for themselves.' },
  { name: 'Olivia T.', text: 'I wish we had done this years ago. The time savings are transformational.' },
  { name: 'Alex H.', text: 'They don\'t just build and leave. The post-launch support has been incredible.' },
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

function MarqueeRow({ dir, items }: { dir: 'left' | 'right'; items: typeof marqueeTestimonials }) {
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
        {items.map((t, i) => (
          <div
            key={`${t.name}-${i}`}
            style={{
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '18px',
              padding: '16px 20px',
              width: '280px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} size={11} color="#D9B36A" fill="#D9B36A" />
              ))}
            </div>
            <p style={{ font: '400 12.5px/1.5 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.7)', margin: 0 }}>
              &ldquo;{t.text}&rdquo;
            </p>
            <span style={{ font: '600 11px/1.4 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.45)' }}>
              — {t.name}
            </span>
          </div>
        ))}
        {items.map((t, i) => (
          <div
            key={`dup-${t.name}-${i}`}
            style={{
              background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: '18px',
              padding: '16px 20px',
              width: '280px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} size={11} color="#D9B36A" fill="#D9B36A" />
              ))}
            </div>
            <p style={{ font: '400 12.5px/1.5 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.7)', margin: 0 }}>
              &ldquo;{t.text}&rdquo;
            </p>
            <span style={{ font: '600 11px/1.4 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.45)' }}>
              — {t.name}
            </span>
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
            What our clients say
          </h2>
        </div>

        {/* Featured testimonial */}
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
                {Array.from({ length: featuredTestimonials[current].stars }).map((_, i) => (
                  <Star key={i} size={16} color="#D9B36A" fill="#D9B36A" />
                ))}
              </div>
              <blockquote
                style={{
                  font: '400 17px/1.7 "Instrument Sans",sans-serif',
                  color: 'rgba(245,240,232,.8)',
                  margin: '0 0 20px',
                }}
              >
                &ldquo;{featuredTestimonials[current].text}&rdquo;
              </blockquote>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ font: '600 14px/1.4 "Space Grotesk",sans-serif', color: '#F5F0E8' }}>
                    {featuredTestimonials[current].name}
                  </div>
                  <div style={{ font: '400 12px "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.45)' }}>
                    {featuredTestimonials[current].role}
                  </div>
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

          {/* Dot nav */}
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

        {/* Marquee rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <MarqueeRow dir="left" items={marqueeTestimonials.slice(0, 6)} />
          <MarqueeRow dir="right" items={marqueeTestimonials.slice(6)} />
        </div>
      </div>
    </section>
  )
}
