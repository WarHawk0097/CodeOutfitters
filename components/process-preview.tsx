'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Zap, Search, Hammer, Clock } from 'lucide-react'
import Link from 'next/link'


const steps = [
  {
    number: 1,
    title: 'Discovery Call',
    description: 'We hop on a 30-minute call to map your biggest time drains, understand your stack, and identify the highest-ROI automation opportunities.',
    day: 'Day 1',
    icon: Search,
  },
  {
    number: 2,
    title: 'Custom Scope',
    description: 'You receive a fixed-scope proposal with clear deliverables, timeline, and pricing — no surprises, no hourly creep.',
    day: 'Day 2-3',
    icon: Zap,
  },
  {
    number: 3,
    title: 'We Build It',
    description: 'We build, connect, and test every piece of your automation end-to-end. You get a working preview before anything goes live.',
    day: 'Day 4-6',
    icon: Hammer,
  },
  {
    number: 4,
    title: 'You Save Time',
    description: 'Your automation ships live. We hand over full documentation, and you start reclaiming hours every single day. Support included.',
    day: 'Day 7 LIVE',
    icon: Clock,
  },
]

function StepCard({
  step,
  index,
  spineProgress,
}: {
  step: (typeof steps)[0]
  index: number
  spineProgress: number
}) {
  const isLeft = index % 2 === 0
  const Icon = step.icon
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, amount: 0.3 })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: 'clamp(16px,3vw,40px)',
        alignItems: 'center',
      }}
    >
      {/* Left card (or spacer on right side) */}
      <div
        style={{
          display: 'flex',
          justifyContent: isLeft ? 'flex-end' : 'flex-start',
          order: isLeft ? 1 : 3,
        }}
      >
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, x: isLeft ? -30 : 30, y: 20 }}
          animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: '380px',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.10)',
            borderRadius: '18px',
            padding: '22px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h3 style={{ font: '600 17px/1.2 "Space Grotesk",sans-serif', color: '#F5F0E8', margin: 0 }}>
              {step.title}
            </h3>
          </div>
          <p style={{ font: '400 13.5px/1.6 "Instrument Sans",sans-serif', color: 'rgba(245,240,232,.55)', margin: '0 0 12px' }}>
            {step.description}
          </p>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              font: '700 10.5px "Instrument Sans",sans-serif',
              color: step.day === 'Day 7 LIVE' ? '#2BD483' : '#D9B36A',
              background: step.day === 'Day 7 LIVE'
                ? 'rgba(43,212,131,.10)'
                : 'rgba(217,179,106,.10)',
              border: `1px solid ${
                step.day === 'Day 7 LIVE'
                  ? 'rgba(43,212,131,.25)'
                  : 'rgba(217,179,106,.25)'
              }`,
              borderRadius: '999px',
              padding: '4px 11px',
            }}
          >
            <span
              style={{
                width: '5px', height: '5px', borderRadius: '999px',
                background: step.day === 'Day 7 LIVE' ? '#2BD483' : '#D9B36A',
              }}
            />
            {step.day}
          </span>
        </motion.div>
      </div>

      {/* Center spine + node */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          order: 2,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '999px',
            background: step.day === 'Day 7 LIVE'
              ? 'linear-gradient(135deg,#2BD483,#17A063)'
              : 'linear-gradient(135deg,#D9B36A,#C8A96E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
            flexShrink: 0,
            boxShadow: step.day === 'Day 7 LIVE'
              ? '0 0 30px rgba(43,212,131,.35)'
              : '0 0 24px rgba(217,179,106,.2)',
          }}
        >
          <Icon size={24} color="#0A120E" />
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '22px',
              height: '22px',
              borderRadius: '999px',
              background: '#0A120E',
              border: '2px solid #D9B36A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: '700 10px "Space Grotesk",sans-serif',
              color: '#F5F0E8',
            }}
          >
            {step.number}
          </span>
        </motion.div>
      </div>

      {/* Right spacer (or card) */}
      <div style={{ order: isLeft ? 3 : 1 }} />
    </div>
  )
}

export function ProcessPreview() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 })

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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(800px 500px at 50% 0%, rgba(43,212,131,.06), transparent 60%)',
        }}
      />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <span style={{ width: '40px', height: '1px', background: '#D9B36A', flexShrink: 0 }} />
            <span style={{ font: '700 11.5px "Instrument Sans",sans-serif', letterSpacing: '.18em', color: '#D9B36A', textTransform: 'uppercase' }}>
              02 · How it works
            </span>
            <span style={{ width: '40px', height: '1px', background: '#D9B36A', flexShrink: 0 }} />
          </div>
          <h2
            style={{
              font: '600 clamp(28px,3.8vw,42px)/1.15 "Space Grotesk",sans-serif',
              color: '#F5F0E8',
              letterSpacing: '-.02em',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            From hello to live automation in 7 days
          </h2>
        </div>

        {/* Desktop: grid layout with center spine */}
        <div style={{ position: 'relative' }}>
          {/* Animated spine line */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              bottom: '0',
              width: '4px',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,.06)',
              borderRadius: '2px',
            }}
          >
            <motion.div
              initial={{ height: '0%' }}
              animate={isInView ? { height: '100%' } : {}}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                background: 'linear-gradient(180deg, #D9B36A 0%, #2BD483 60%, #2BD483 100%)',
                borderRadius: '2px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(32px,5vw,60px)' }}>
            {steps.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} spineProgress={0} />
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link
            href="/process"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              font: '600 14px "Instrument Sans",sans-serif',
              color: '#D9B36A', textDecoration: 'none',
            }}
          >
            See the full process <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
