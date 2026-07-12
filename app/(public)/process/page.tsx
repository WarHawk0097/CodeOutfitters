'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, ClipboardList, FileText, Hammer, ShieldCheck, HeadphoneOff, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { FAQ } from '@/components/faq'
import { processFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

const steps = [
  {
    number: '01',
    title: 'Discovery Call',
    days: 'Day 1',
    description: 'A 30-minute call where we map your biggest time drains and identify which workflows are worth automating first. No pitch — just an honest fit assessment.',
    icon: Phone,
  },
  {
    number: '02',
    title: 'Workflow Audit',
    days: 'Days 1–3',
    description: 'We audit the tools and processes you use today. Every integration point, every manual step, every bottleneck — documented before we propose anything.',
    icon: ClipboardList,
  },
  {
    number: '03',
    title: 'Fixed-Scope Proposal',
    days: 'Day 3–4',
    description: 'You receive a clear proposal: exactly what gets built, what it connects to, the timeline, and the fixed price. No ambiguity, no surprise invoices.',
    icon: FileText,
  },
  {
    number: '04',
    title: 'Build Phase',
    days: 'Days 4–8',
    description: 'We build the automation — AI models, triggers, API connections, fallback logic — and share a live preview so you see progress before anything is final.',
    icon: Hammer,
  },
  {
    number: '05',
    title: 'Testing & Handoff',
    days: 'Days 8–10',
    description: 'We run real traffic through the system, monitor every edge case, and tune until it is bulletproof. You approve before it touches your customers.',
    icon: ShieldCheck,
  },
  {
    number: '06',
    title: 'Live & Supported',
    days: '30 days',
    description: 'The system goes live with 30 days of active support. We monitor, catch edge cases, and fine-tune based on real usage — no ghost handoff.',
    icon: HeadphoneOff,
  },
]

const principles = [
  {
    title: 'Scope-first, not price-first',
    description: 'Most agencies start with a price and backfill the scope to fit it. We start with what you actually need and quote that — no packages that sort-of fit.',
  },
  {
    title: 'You see the build as it happens',
    description: 'No black box. No "trust us, we\'ll deliver." You get a working preview mid-build, approve testing results, and sign off before launch.',
  },
  {
    title: 'It is yours at the end',
    description: 'The system is documented, handed over, and designed to run without us. Post-support maintenance is available but never required.',
  },
]

function Hero() {
  return (
    <section
      className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden"
      style={{ background: '#0A120E' }}
      aria-label="Process page header"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(860px 480px at 50% -8%, rgba(23,160,99,.12), transparent 62%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: 'rgba(217,179,106,.12)',
            border: '1px solid rgba(217,179,106,.25)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#D9B36A',
              boxShadow: '0 0 6px rgba(217,179,106,.6)',
              animation: 'valuePulse 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              font: '600 11px "Instrument Sans",sans-serif',
              letterSpacing: '.16em',
              color: '#D9B36A',
              textTransform: 'uppercase',
            }}
          >
            How it works
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            font: '700 clamp(2rem,5vw,3.75rem)/1.1 "Space Grotesk",sans-serif',
            color: '#F5F0E8',
            letterSpacing: '-.03em',
            maxWidth: '700px',
            margin: '0 auto 24px',
          }}
        >
          No generic packages. Every build is scoped.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-3"
        >
          {['Fixed quote after discovery', 'Transparent proposal', 'No pressure to commit'].map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                color: 'rgba(245,240,232,.78)',
              }}
            >
              <Check className="w-3.5 h-3.5" style={{ color: '#2BD483' }} />
              {chip}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ProcessTimeline() {
  const spineRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const spine = spineRef.current
    if (!section || !spine) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const visible = entry.intersectionRect.height
            const total = section.scrollHeight
            const pct = Math.min(visible / total, 1)
            setProgress(pct)
          }
        })
      },
      { threshold: Array.from({ length: 20 }, (_, i) => (i + 1) / 20) }
    )

    observer.observe(section)

    const handleScroll = () => {
      const rect = section.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const totalVisible = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
      const pct = Math.min(totalVisible / (section.scrollHeight * 0.7), 1)
      setProgress(Math.max(0, pct))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#F7F2EA' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(23,160,99,.08)',
              border: '1px solid rgba(23,160,99,.18)',
            }}
          >
            <span
              style={{
                font: '600 11px "Instrument Sans",sans-serif',
                letterSpacing: '.16em',
                color: '#17A063',
                textTransform: 'uppercase',
              }}
            >
              The full process
            </span>
          </span>
          <h2
            style={{
              font: '700 clamp(1.75rem,4vw,2.75rem)/1.12 "Space Grotesk",sans-serif',
              color: '#0A120E',
              letterSpacing: '-.02em',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            Discovery to handoff, one connected path.
          </h2>
        </div>

        <div className="relative">
          <div
            ref={spineRef}
            className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 rounded-full"
            style={{ background: 'rgba(13,58,49,.12)' }}
            aria-hidden="true"
          />
          <div
            className="hidden md:block absolute left-1/2 -translate-x-px top-0 w-0.5 rounded-full transition-all duration-300"
            style={{
              height: `${progress * 100}%`,
              background: 'linear-gradient(180deg,#17A063,#D9B36A)',
              boxShadow: '0 0 12px rgba(23,160,99,.25)',
            }}
            aria-hidden="true"
          />

          <div className="flex flex-col gap-12">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isLeft = i % 2 === 0

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex items-start gap-6 md:gap-0"
                  style={{
                    flexDirection: isLeft ? 'row' : 'row-reverse',
                  }}
                >
                  <div
                    className="hidden md:block w-[calc(50%-40px)]"
                    style={{
                      textAlign: isLeft ? 'right' : 'left',
                      paddingRight: isLeft ? '0' : '0',
                      paddingLeft: isLeft ? '0' : '0',
                    }}
                  >
                    <div
                      className={`inline-block text-left ${isLeft ? 'ml-auto' : 'mr-auto'}`}
                      style={{
                        maxWidth: '400px',
                        background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                        border: '1px solid rgba(13,58,49,.14)',
                        borderRadius: '22px',
                        padding: '24px',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'rgba(23,160,99,.1)',
                            color: '#17A063',
                          }}
                        >
                          {step.days}
                        </span>
                      </div>
                      <h3
                        style={{
                          font: '600 18px/1.2 "Space Grotesk",sans-serif',
                          color: '#0A120E',
                          marginBottom: '8px',
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          font: '400 14px/1.65 "Instrument Sans",sans-serif',
                          color: '#5B6355',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className="hidden md:flex relative z-10 shrink-0 items-center justify-center"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '999px',
                      background: 'linear-gradient(135deg,#17A063,#0E7A4E)',
                      border: '3px solid #F7F2EA',
                      boxShadow: '0 0 0 2px rgba(23,160,99,.25)',
                    }}
                  >
                    <span
                      style={{
                        font: '700 14px "Space Grotesk",sans-serif',
                        color: '#F5F0E8',
                      }}
                    >
                      {step.number}
                    </span>
                  </div>

                  <div className="md:hidden flex gap-4 w-full">
                    <div
                      className="relative z-10 shrink-0 flex items-center justify-center"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg,#17A063,#0E7A4E)',
                        border: '2px solid #F7F2EA',
                        boxShadow: '0 0 0 2px rgba(23,160,99,.2)',
                      }}
                    >
                      <span
                        style={{
                          font: '700 12px "Space Grotesk",sans-serif',
                          color: '#F5F0E8',
                        }}
                      >
                        {step.number}
                      </span>
                    </div>
                    <div
                      className="flex-1"
                      style={{
                        background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                        border: '1px solid rgba(13,58,49,.14)',
                        borderRadius: '22px',
                        padding: '20px',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'rgba(23,160,99,.1)',
                            color: '#17A063',
                          }}
                        >
                          {step.days}
                        </span>
                      </div>
                      <h3
                        style={{
                          font: '600 17px/1.2 "Space Grotesk",sans-serif',
                          color: '#0A120E',
                          marginBottom: '6px',
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          font: '400 13.5px/1.6 "Instrument Sans",sans-serif',
                          color: '#5B6355',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className="hidden md:block w-[calc(50%-40px)]"
                    style={{
                      textAlign: isLeft ? 'left' : 'right',
                    }}
                  >
                    <div
                      className={`inline-block text-left ${isLeft ? 'mr-auto' : 'ml-auto'}`}
                      style={{
                        maxWidth: '400px',
                        background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                        border: '1px solid rgba(13,58,49,.14)',
                        borderRadius: '22px',
                        padding: '24px',
                        visibility: 'hidden',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'rgba(23,160,99,.1)',
                            color: '#17A063',
                          }}
                        >
                          {step.days}
                        </span>
                      </div>
                      <h3
                        style={{
                          font: '600 18px/1.2 "Space Grotesk",sans-serif',
                          color: '#0A120E',
                          marginBottom: '8px',
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          font: '400 14px/1.65 "Instrument Sans",sans-serif',
                          color: '#5B6355',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyNoPackages() {
  return (
    <section
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0A120E' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(760px 420px at 50% 50%, rgba(23,160,99,.06), transparent 62%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            <span
              style={{
                font: '600 11px "Instrument Sans",sans-serif',
                letterSpacing: '.16em',
                color: '#D9B36A',
                textTransform: 'uppercase',
              }}
            >
              Custom quoting philosophy
            </span>
          </span>
          <h2
            style={{
              font: '700 clamp(1.75rem,4vw,2.75rem)/1.12 "Space Grotesk",sans-serif',
              color: '#F5F0E8',
              letterSpacing: '-.02em',
              maxWidth: '620px',
              margin: '0 auto 16px',
            }}
          >
            Why no packages?
          </h2>
          <p
            style={{
              font: '400 16px/1.65 "Instrument Sans",sans-serif',
              color: 'rgba(245,240,232,.55)',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            Packages force your business into someone else&apos;s shape. We start from your actual workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {principles.map((p) => (
            <div
              key={p.title}
              className="rounded-xl p-7 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <h3
                style={{
                  font: '600 17px/1.3 "Space Grotesk",sans-serif',
                  color: '#F5F0E8',
                  marginBottom: '10px',
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  font: '400 14px/1.65 "Instrument Sans",sans-serif',
                  color: 'rgba(245,240,232,.55)',
                }}
              >
                {p.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group/link"
            style={{
              background: 'linear-gradient(160deg,#E7C57E,#D9B36A)',
              color: '#0A120E',
            }}
          >
            <span>Start with a free discovery call</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function ProcessPage() {
  return (
    <>
      <Hero />
      <ProcessTimeline />
      <WhyNoPackages />
      <FAQ items={processFaqs} title="Process questions" />
      <CTABanner />
    </>
  )
}
