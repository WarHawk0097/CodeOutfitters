'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Wrench, Heart, Building2, ShoppingBag, Briefcase, GraduationCap, MapPin } from 'lucide-react'
import Link from 'next/link'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { Badge } from '@/components/ui/badge'
import { FAQ } from '@/components/faq'
import { industriesFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

const industries = [
  {
    icon: Wrench,
    name: 'Home Services / HVAC',
    problems: 'Missed calls after hours, slow quote turnaround, techs double-booked or no-showing. Service requests get lost on voicemail.',
    automations: ['Missed-call text-back', 'Auto quote follow-up', 'Dispatch reminders', 'Review request automation'],
    tools: 'ServiceTitan, Housecall Pro, Jobber, Google Calendar, WhatsApp',
  },
  {
    icon: Heart,
    name: 'Healthcare Clinics / Med-Spas',
    problems: 'No-shows eating 20%+ of schedule capacity, intake forms chased down manually, staff buried in reminder calls.',
    automations: ['Appointment reminders', 'Digital intake routing', 'Rebooking nudges', 'Insurance verification'],
    tools: 'Calendly, Square Appointments, EHR exports, SMS, Email',
  },
  {
    icon: Building2,
    name: 'Real Estate',
    problems: 'Leads go cold waiting for a reply, showings scheduled by phone tag, paperwork chased by hand across every deal.',
    automations: ['Instant lead qualification', 'Showing scheduling', 'Document follow-up', 'Drip nurture sequences'],
    tools: 'CRMs, DocuSign, MLS feeds, WhatsApp, Gmail',
  },
  {
    icon: ShoppingBag,
    name: 'E-commerce / Retail',
    problems: 'Order and invoice entry done by hand, support inbox flooded with the same tracking questions every day.',
    automations: ['Order-to-invoice sync', 'Order status auto-replies', 'Returns triage', 'Abandoned cart follow-up'],
    tools: 'Shopify, QuickBooks, Stripe, Zendesk, Gmail',
  },
  {
    icon: Briefcase,
    name: 'Professional Services',
    problems: 'Client onboarding scattered across email threads, proposals and invoices tracked in spreadsheets that never sync.',
    automations: ['Client onboarding sequences', 'Proposal-to-invoice handoff', 'Status update emails', 'Time entry reminders'],
    tools: 'Gmail/Outlook, Notion, QuickBooks, DocuSign, Slack',
  },
  {
    icon: GraduationCap,
    name: 'Education / Training',
    problems: 'Enrollment questions answered one-by-one, cohort reminders sent manually, certificates issued by hand.',
    automations: ['Enrollment chat answers', 'Cohort reminder sequences', 'Certificate delivery', 'Payment follow-ups'],
    tools: 'Kajabi, Teachable, Mailchimp, Google Sheets, Zoom',
  },
  {
    icon: MapPin,
    name: 'Local Service Businesses',
    problems: 'Booking requests arrive on 5 different channels (Instagram, Google, WhatsApp, phone, email) and some get missed.',
    automations: ['Unified booking intake', 'Review request automation', 'No-show follow-up', 'Multi-channel inbox'],
    tools: 'WhatsApp, Instagram DMs, Google Business Profile, Calendly',
  },
]

const commonNeeds = [
  { num: '01', title: 'Lead Intake', desc: 'Every inbound message gets a fast, qualified reply — before the lead goes cold.' },
  { num: '02', title: 'Scheduling', desc: 'Booking, rescheduling, and reminders happen without a phone call or back-and-forth.' },
  { num: '03', title: 'Follow-up', desc: 'Quotes, proposals, and after-visit messages go out automatically, consistently on time.' },
  { num: '04', title: 'Back Office', desc: 'Invoices, records, and status updates sync without manual re-entry or spreadsheet chaos.' },
]

const exampleWorkflows = [
  {
    tag: 'Home Services',
    title: 'After-hours missed call → booked job',
    steps: [
      'Missed call triggers an instant SMS with a booking link',
      'Customer picks a slot from live tech availability (no phone tag)',
      'Job auto-added to dispatch board, tech notified, reminder scheduled',
    ],
  },
  {
    tag: 'Real Estate',
    title: 'New lead → qualified showing',
    steps: [
      'Inquiry auto-qualified by budget, area, and timeline in under 30 seconds',
      'Hot leads routed straight to the right agent with full context',
      'Showing booked and confirmed — calendar updated, no back-and-forth',
    ],
  },
  {
    tag: 'E-commerce',
    title: 'Order placed → invoice reconciled',
    steps: [
      'Order synced from store to invoicing tool the second it comes in',
      'Payment matched automatically against the invoice line by line',
      'Customer gets a shipping status update — zero manual entry',
    ],
  },
]

const stats = [
  { num: '7', label: 'Industries served' },
  { num: '120+', label: 'Systems shipped' },
  { num: '7 days', label: 'Typical build time' },
  { num: '30 days', label: 'Support included' },
]

function Hero() {
  return (
    <section
      className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden"
      style={{ background: '#0A120E' }}
      aria-label="Industries page header"
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
            Who we build for
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
            maxWidth: '780px',
            margin: '0 auto 20px',
          }}
        >
          Automation that fits how your industry actually works.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            font: '400 17px/1.65 "Instrument Sans",sans-serif',
            color: 'rgba(245,240,232,.64)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          Every industry loses time differently. We start from the workflows you already run — not a generic template.
        </motion.p>
      </div>
    </section>
  )
}

function IndustriesGrid() {
  return (
    <section
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#F7F2EA' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
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
              Seven industries, one approach
            </span>
          </span>
          <h2
            style={{
              font: '700 clamp(1.75rem,4vw,2.75rem)/1.12 "Space Grotesk",sans-serif',
              color: '#0A120E',
              letterSpacing: '-.02em',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Built around how your business already runs.
          </h2>
        </div>

        <BentoGrid>
          {industries.map((ind, i) => {
            const Icon = ind.icon
            const spans = [7, 5, 5, 7, 7, 5, 5] as const
            return (
              <BentoCard
                key={ind.name}
                span={spans[i] as 5 | 7}
                className="p-0 border-0 shadow-none hover:translate-y-0"
              >
                <div
                  className="relative p-7 md:p-8 h-full transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                    border: '1px solid rgba(13,58,49,.14)',
                    borderRadius: '22px',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(23,160,99,.1)',
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: '#17A063' }} />
                    </div>
                    <h3
                      style={{
                        font: '600 18px/1.2 "Space Grotesk",sans-serif',
                        color: '#0A120E',
                      }}
                    >
                      {ind.name}
                    </h3>
                  </div>

                  <p
                    style={{
                      font: '400 14px/1.65 "Instrument Sans",sans-serif',
                      color: '#5B6355',
                      marginBottom: '16px',
                    }}
                  >
                    {ind.problems}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {ind.automations.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{
                          background: 'rgba(23,160,99,.08)',
                          color: '#17A063',
                          border: '1px solid rgba(23,160,99,.18)',
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  <p
                    style={{
                      font: '400 12px/1.5 "Instrument Sans",sans-serif',
                      color: '#8A857B',
                    }}
                  >
                    <span style={{ color: '#5B6355', fontWeight: 600 }}>Connects with:</span>{' '}
                    {ind.tools}
                  </p>

                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(13,58,49,.08)' }}>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group/link"
                      style={{ color: '#128A54' }}
                    >
                      <span>Talk to us about {ind.name.split('/')[0].trim()}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </BentoCard>
            )
          })}
        </BentoGrid>
      </div>
    </section>
  )
}

function CommonNeeds() {
  return (
    <section
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0A120E' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(760px 380px at 50% 50%, rgba(23,160,99,.06), transparent 62%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2
            style={{
              font: '700 clamp(1.75rem,4vw,2.75rem)/1.12 "Space Grotesk",sans-serif',
              color: '#F5F0E8',
              letterSpacing: '-.02em',
              maxWidth: '620px',
              margin: '0 auto 16px',
            }}
          >
            Whatever your industry, most bottlenecks fall into the same buckets.
          </h2>
          <p
            style={{
              font: '400 16px/1.65 "Instrument Sans",sans-serif',
              color: 'rgba(245,240,232,.55)',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            We solve these four problems across every business we work with.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {commonNeeds.map((need) => (
            <div
              key={need.num}
              className="rounded-xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <div
                style={{
                  font: '700 28px/1 "Space Grotesk",sans-serif',
                  color: '#D9B36A',
                  marginBottom: '14px',
                }}
              >
                {need.num}
              </div>
              <h3
                style={{
                  font: '600 16px/1.3 "Space Grotesk",sans-serif',
                  color: '#F5F0E8',
                  marginBottom: '8px',
                }}
              >
                {need.title}
              </h3>
              <p
                style={{
                  font: '400 13.5px/1.6 "Instrument Sans",sans-serif',
                  color: 'rgba(245,240,232,.55)',
                }}
              >
                {need.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExampleWorkflows() {
  return (
    <section
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#F7F2EA' }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
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
              In practice
            </span>
          </span>
          <h2
            style={{
              font: '700 clamp(1.75rem,4vw,2.5rem)/1.12 "Space Grotesk",sans-serif',
              color: '#0A120E',
              letterSpacing: '-.02em',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            Example workflows by industry.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exampleWorkflows.map((wf) => (
            <div
              key={wf.title}
              className="rounded-xl p-7 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                border: '1px solid rgba(13,58,49,.14)',
                borderRadius: '22px',
              }}
            >
              <Badge variant="primary">{wf.tag}</Badge>
              <h3
                style={{
                  font: '600 16px/1.3 "Space Grotesk",sans-serif',
                  color: '#0A120E',
                  marginTop: '14px',
                  marginBottom: '16px',
                }}
              >
                {wf.title}
              </h3>
              <ol className="space-y-3">
                {wf.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#5B6355' }}>
                    <span
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: 'rgba(23,160,99,.1)',
                        color: '#17A063',
                      }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                style={{
                  font: '700 clamp(1.5rem,3vw,2rem)/1 "Space Grotesk",sans-serif',
                  color: '#17A063',
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  font: '400 13px "Instrument Sans",sans-serif',
                  color: '#5B6355',
                  marginTop: '4px',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function IndustriesPage() {
  return (
    <>
      <Hero />
      <IndustriesGrid />
      <CommonNeeds />
      <ExampleWorkflows />
      <FAQ items={industriesFaqs} title="Industry questions" />
      <CTABanner />
    </>
  )
}
