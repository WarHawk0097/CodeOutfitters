'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Star, Home, ShoppingBag, HeartPulse, Scale, Truck, Wrench } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

interface CaseStudy {
  icon: typeof Home
  industry: string
  system: string
  title: string
  summary: string
  problem: string
  solution: string
  metrics: { value: string; label: string }[]
  sample?: boolean
}

const caseStudies: CaseStudy[] = [
  {
    icon: Home, industry: 'Real Estate', system: 'WhatsApp Automation',
    title: 'A 3-person agency doubled lead response with an always-on WhatsApp system.',
    summary: 'Leads were slipping through the cracks after hours. Deployed an AI WhatsApp bot that qualifies, responds, and books viewings 24/7.',
    problem: 'A real estate office was losing leads to faster competitors. Manual follow-ups took hours every day, and weekend inquiries went unanswered until Monday.',
    solution: 'We deployed an AI WhatsApp bot that qualifies leads, answers property questions, and books viewings automatically — integrated with their CRM for seamless handoff to agents.',
    metrics: [
      { value: '2x', label: 'Response Rate' },
      { value: '87%', label: 'Faster Replies' },
      { value: '18 hrs', label: 'Saved/Week' },
    ],
  },
  {
    icon: ShoppingBag, industry: 'E-commerce', system: 'Invoice Automation',
    title: 'Invoice processing went from 4 hours a day to 8 minutes.',
    summary: 'Manual invoice creation and reconciliation was eating a full half-day. Now 200+ invoices process daily with zero errors.',
    problem: 'An online retailer manually created invoices and reconciled orders every day. Data entry errors caused payment delays and customer complaints.',
    solution: 'Our automation pipeline ingests orders, generates invoices, reconciles payments, and posts to accounting — processing 200+ invoices daily with zero human touch.',
    metrics: [
      { value: '97%', label: 'Time Saved' },
      { value: '0', label: 'Errors' },
      { value: '$1,200', label: 'Saved/Month' },
    ],
  },
  {
    icon: HeartPulse, industry: 'Healthcare', system: 'Booking Bot',
    title: 'Medical clinic eliminated 90% of phone-based scheduling.',
    summary: 'Overwhelmed by appointment calls, a busy clinic deployed an AI booking bot that handles 24/7 scheduling and automated reminders.',
    problem: 'A busy clinic was overwhelmed by appointment calls, losing patients to long hold times. No-shows disrupted the daily schedule.',
    solution: 'AI booking bot that syncs with their calendar, handles rescheduling, and sends automatic reminders — cutting no-shows and freeing front desk staff.',
    metrics: [
      { value: '90%', label: 'Fewer Calls' },
      { value: '40%', label: 'No-Show Drop' },
      { value: '24/7', label: 'Booking' },
    ],
  },
  {
    icon: Scale, industry: 'Legal', system: 'Client Intake',
    title: 'Law firm cut intake time by 80% with automated client forms.',
    summary: 'Paper-based intake was causing missed forms and slow response. Automated client intake captures every detail before the first call.',
    problem: 'A law firm relied on paper intake forms. Missing information meant back-and-forth calls, and potential clients often went to firms that responded faster.',
    solution: 'Automated digital intake that collects client details, validates documents, and qualifies cases before connecting to the attorney — cutting intake from hours to minutes.',
    metrics: [
      { value: '80%', label: 'Faster Intake' },
      { value: '0', label: 'Missed Forms' },
      { value: '12 hrs', label: 'Saved/Week' },
    ],
    sample: true,
  },
  {
    icon: Truck, industry: 'Logistics', system: 'Dispatch Automation',
    title: 'Dispatch coordination became 35% faster with automated routing.',
    summary: 'Manual dispatching was causing delays and missed pickups. Automated routing and driver notifications streamlined the entire operation.',
    problem: 'A logistics company was dispatching manually — calls, texts, whiteboards. Drivers missed pickups, and customers had no visibility into ETAs.',
    solution: 'Automated dispatch that assigns routes, notifies drivers, shares tracking links with customers, and logs every delivery in real time.',
    metrics: [
      { value: '35%', label: 'Faster Dispatch' },
      { value: '100%', label: 'Logged' },
      { value: '22 hrs', label: 'Saved/Week' },
    ],
    sample: true,
  },
  {
    icon: Wrench, industry: 'Home Services', system: 'WhatsApp Quoting',
    title: 'HVAC company tripled online reviews with automated follow-ups.',
    summary: 'Follow-ups and quotes were manual and inconsistent. A WhatsApp system now handles quoting, booking, and review requests automatically.',
    problem: 'A home services company was losing quoting opportunities because customers had to call during business hours. Review collection was an afterthought.',
    solution: 'WhatsApp quoting bot that provides instant estimates, books appointments, and sends automated review requests after each job — all without human involvement.',
    metrics: [
      { value: '3x', label: 'More Reviews' },
      { value: '24/7', label: 'Quoting' },
      { value: '15 hrs', label: 'Saved/Week' },
    ],
    sample: true,
  },
]

const industries = ['All', 'Real Estate', 'E-commerce', 'Healthcare', 'Legal', 'Logistics', 'Home Services']

const testimonials = [
  {
    name: 'Marcus T.',
    role: 'Owner, Sunrise Realty',
    text: 'We were losing leads every weekend when the office was closed. CodeOutfitters built a WhatsApp bot that now qualifies and responds to every inquiry instantly. We closed 3 deals last month that we would have lost before.',
    result: 'Leads no longer slip through overnight',
  },
  {
    name: 'Jennifer K.',
    role: 'Operations Manager, FreshBite Co.',
    text: 'Invoice processing was killing us — 4 hours a day just entering data. The automation they built handles 200+ orders daily with zero errors. My team finally focuses on actual work.',
    result: 'Admin work no longer dominates the day',
  },
  {
    name: 'Dr. Samuel R.',
    role: 'Practice Director, ClearView Clinic',
    text: 'The appointment bot cut our phone calls by 90%. Patients love booking 24/7. No-shows dropped 40% because of the automated reminders. Setup was done in 5 days exactly as promised.',
    result: 'Clients book without calling the office',
  },
]

function CaseStudiesHero() {
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
            Sample work
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.1] text-[#F5F0E8] -tracking-[.02em] mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Representative <span style={{ color: '#2BD483' }}>automation outcomes.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'rgba(245,240,232,.62)' }}
        >
          Every build is measured by one thing: time and money removed from a manual process.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs mt-4"
          style={{ color: 'rgba(245,240,232,.35)' }}
        >
          These case studies are illustrative — built from typical engagement patterns and results we see across similar builds.
        </motion.p>
      </div>
    </section>
  )
}

function FilterPills({ selected, onChange }: { selected: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-5 md:px-8 pt-8 pb-2" style={{ background: '#F7F2EA' }}>
      {industries.map((ind) => (
        <button
          key={ind}
          onClick={() => onChange(ind)}
          className="text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200"
          style={{
            background: selected === ind ? '#0E241A' : '#fff',
            color: selected === ind ? '#F5F0E8' : '#5B6355',
            borderColor: selected === ind ? '#0E241A' : 'rgba(13,58,49,.14)',
          }}
        >
          {ind}
        </button>
      ))}
    </div>
  )
}

function CaseStudyCard({ study, index }: { study: CaseStudy; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = study.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="rounded-[22px] overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
        border: '1px solid rgba(13,58,49,.14)',
        boxShadow: '0 2px 20px rgba(0,0,0,.04)',
      }}
    >
      <div className="p-6 md:p-7 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{
                background: 'rgba(23,160,99,.08)',
                color: '#128A54',
                border: '1px solid rgba(23,160,99,.16)',
              }}
            >
              {study.industry}
            </span>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{
                background: 'rgba(217,179,106,.08)',
                color: '#D9B36A',
                border: '1px solid rgba(217,179,106,.16)',
              }}
            >
              {study.system}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
            style={{ background: 'rgba(23,160,99,.1)' }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: '#17A063' }} />
          </div>
        </div>

        <h3
          className="text-base font-semibold leading-snug mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
        >
          {study.title}
        </h3>

        <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: '#5B6355' }}>
          {study.summary}
        </p>

        {study.sample && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide mb-3 px-2 py-0.5 rounded-full inline-block self-start"
            style={{
              background: 'rgba(217,179,106,.1)',
              color: '#D9B36A',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            Sample project
          </span>
        )}

        <div
          className="grid grid-cols-3 gap-3 py-4 mb-3"
          style={{ borderTop: '1px solid rgba(13,58,49,.08)', borderBottom: '1px solid rgba(13,58,49,.08)' }}
        >
          {study.metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div
                className="text-lg font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#17A063' }}
              >
                {m.value}
              </div>
              <span className="text-[10px] font-medium leading-tight block mt-0.5" style={{ color: '#8A857B' }}>{m.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 hover:gap-2 mb-3"
          style={{ color: '#128A54' }}
        >
          {expanded ? 'Hide full story' : 'Read the full story'}
          <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div
                className="pt-3 text-xs leading-relaxed space-y-2"
                style={{ borderTop: '1px solid rgba(13,58,49,.08)', color: '#5B6355' }}
              >
                <p><strong style={{ color: '#0A120E' }}>Problem:</strong> {study.problem}</p>
                <p><strong style={{ color: '#0A120E' }}>Solution:</strong> {study.solution}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 hover:gap-2"
          style={{ color: '#128A54' }}
        >
          Get a similar system
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  )
}

function CaseStudiesGrid() {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All' ? caseStudies : caseStudies.filter((c) => c.industry === filter)

  return (
    <section style={{ background: '#F7F2EA' }}>
      <FilterPills selected={filter} onChange={setFilter} />
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20 md:pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {filtered.map((study, i) => (
            <CaseStudyCard key={study.title} study={study} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsRotator() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5200)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0E241A' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(540px 340px at 50% 30%, rgba(23,160,99,.08), transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-6"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            Client results
          </span>
        </motion.div>

        <div className="relative min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="flex gap-1 mb-6 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D9B36A]" style={{ color: '#D9B36A' }} />
                ))}
              </div>
              <blockquote
                className="text-lg md:text-xl leading-relaxed font-medium mb-8 max-w-2xl"
                style={{ color: 'rgba(245,240,232,.85)' }}
              >
                &ldquo;{testimonials[current].text}&rdquo;
              </blockquote>
              <p
                className="font-semibold text-sm"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                {testimonials[current].name}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,.5)' }}>
                {testimonials[current].role}
              </p>
              <div
                className="mt-4 text-xs font-semibold px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(217,179,106,.1)',
                  color: '#D9B36A',
                  border: '1px solid rgba(217,179,106,.2)',
                }}
              >
                {testimonials[current].result}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background: i === current ? '#D9B36A' : 'rgba(217,179,106,.25)',
              }}
            />
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
          Ready to see what automation looks like <span style={{ color: '#17A063' }}>for your business</span>?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-base leading-relaxed mb-8"
          style={{ color: '#5B6355' }}
        >
          Book a free discovery call and we&apos;ll map your biggest time drains — no obligation, no sales pitch.
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

export function CaseStudiesPageClient() {
  return (
    <>
      <CaseStudiesHero />
      <CaseStudiesGrid />
      <TestimonialsRotator />
      <CTASection />
    </>
  )
}
