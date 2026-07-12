'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, GitBranch, Users, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const beliefs = [
  {
    icon: GitBranch, title: 'Automation should disappear',
    desc: 'Great tools don\'t add friction. Invisible automation is the only kind worth building — everything else is just more busywork.',
  },
  {
    icon: Users, title: 'Scope before code',
    desc: 'We map the full workflow — every handoff, every exception — before writing a single line. Speed comes from clarity, not rushing.',
  },
  {
    icon: MessageCircle, title: 'Humans stay in the loop',
    desc: 'AI handles volume. People handle decisions. We never design a system that removes human judgment from things that matter.',
  },
  {
    icon: ShieldCheck, title: 'Clear communication over jargon',
    desc: 'No technical gatekeeping. You understand every part of what we build, how it works, and why it\'s set up that way.',
  },
]

const processSteps = [
  { num: '01', title: 'You talk, we listen', desc: 'We learn your actual workflow — no assumptions, no template questions.' },
  { num: '02', title: 'One point of contact', desc: 'You deal with one person end-to-end, not a rotation of strangers.' },
  { num: '03', title: 'Documented handoff', desc: 'Every system ships with docs you can actually use — not tribal knowledge.' },
  { num: '04', title: 'Support after launch', desc: 'We stay on deck post-launch to catch issues and answer questions.' },
]

const qualityItems = [
  {
    title: 'Quality & reliability',
    desc: 'Every system is tested against real data before it touches your customers. Edge cases, slow integrations, unexpected inputs — we simulate the mess before you encounter it live.',
  },
  {
    title: 'Tool & automation mindset',
    desc: 'We don\'t sell you a platform or lock you into a proprietary stack. Every build uses proven tools — n8n, Make, Claude, your CRM — connected in a way that stays yours after handoff.',
  },
]

const trustItems = [
  { title: 'Fixed-scope proposals', desc: 'You see exactly what gets built and what it costs before we start. No hourly creep, no surprise invoices.' },
  { title: 'Testing before launch', desc: 'Nothing goes live until you\'ve approved it. We test against real scenarios, not demo data.' },
  { title: 'Direct communication', desc: 'No account managers, no ticket queues. You talk directly to the person building your system.' },
]

function AboutHero() {
  return (
    <section
      className="relative pt-28 pb-20 md:pt-32 md:pb-28 px-5 md:px-8 overflow-hidden"
      style={{ background: '#0A120E' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(760px 420px at 50% -15%, rgba(23,160,99,.18), transparent 62%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-6"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            The studio
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.1] text-[#F5F0E8] -tracking-[.02em] mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          An automation studio,<br />
          <span style={{ color: 'rgba(245,240,232,.65)' }}>not an agency of decks.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'rgba(245,240,232,.62)' }}
        >
          We build automation systems that replace busywork — not meetings about busywork.
          Fixed scope, documented handoff, fully owned by you.
        </motion.p>
      </div>
    </section>
  )
}

function MissionSection() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden" style={{ background: '#F7F2EA' }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-lg md:text-xl leading-relaxed"
          style={{ color: '#5B6355' }}
        >
          Most small businesses don&apos;t need more software. They need the software they already have to
          stop requiring human babysitting. CodeOutfitters connects the tools you already use so data
          moves, replies send, and follow-ups happen — without someone at a desk making it all work.
        </motion.p>
      </div>
    </section>
  )
}

function WhatWeBelieve() {
  const ref = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-4"
            style={{
              color: '#17A063',
              background: 'rgba(23,160,99,.08)',
              border: '1px solid rgba(23,160,99,.16)',
            }}
          >
            What we believe
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
          >
            Principles that shape every build
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {beliefs.map((b, i) => {
            const span = i % 2 === 0 ? 'md:col-span-7' : 'md:col-span-5'
            const Icon = b.icon
            return (
              <div
                key={b.title}
                data-reveal
                className={`${span} col-span-1 rounded-[22px] p-7 md:p-8 transition-all duration-300 hover:-translate-y-0.5`}
                style={{
                  background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                  border: '1px solid rgba(13,58,49,.14)',
                  boxShadow: '0 2px 20px rgba(0,0,0,.04)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(23,160,99,.1)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#17A063' }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
                >
                  {b.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5B6355' }}>{b.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HowWeWork() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)

  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0E241A' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(540px 340px at 30% 50%, rgba(23,160,99,.08), transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            How we work
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em] mt-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
          >
            Process without the overhead
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {processSteps.map((s) => (
            <div key={s.num} data-reveal className="flex flex-col gap-3">
              <span
                className="text-[clamp(2.5rem,4vw,3rem)] font-semibold leading-none"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'rgba(217,179,106,.3)' }}
              >
                {s.num}
              </span>
              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,.55)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function QualityPrinciples() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden" style={{ background: '#fff' }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {qualityItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className="w-1 h-10 rounded-full mb-5"
                style={{ background: 'linear-gradient(180deg,#17A063,transparent)' }}
              />
              <h3
                className="text-xl font-semibold mb-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5B6355' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustSection() {
  const ref = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#08160F' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(540px 340px at 70% 30%, rgba(23,160,99,.06), transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            Why trust us
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em] mt-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
          >
            No surprises. No fine print.
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustItems.map((t) => (
            <div
              key={t.title}
              data-reveal
              className="rounded-[20px] p-7"
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <h3
                className="text-base font-semibold mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                {t.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,.55)' }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden" style={{ background: '#F7F2EA' }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
        >
          Ready to stop working <span style={{ color: '#17A063' }}>in</span> your business?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-base leading-relaxed mb-8"
          style={{ color: '#5B6355' }}
        >
          Book a free discovery call. We&apos;ll map your biggest time drains and tell you exactly what
          automation looks like for your business.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:gap-3"
            style={{
              background: 'linear-gradient(160deg,#E7C57E,#D9B36A)',
              color: '#0A120E',
              boxShadow: '0 12px 32px rgba(217,179,106,.25), inset 0 1px 0 rgba(255,255,255,.4)',
            }}
          >
            Book Free Discovery Call
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export function AboutPageClient() {
  return (
    <>
      <AboutHero />
      <MissionSection />
      <WhatWeBelieve />
      <HowWeWork />
      <QualityPrinciples />
      <TrustSection />
      <CTASection />
    </>
  )
}
