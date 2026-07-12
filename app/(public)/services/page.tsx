'use client'

import { useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, MessageSquare, Mail, Headphones, CalendarCheck, FileText, Puzzle, ChevronDown, ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { FAQ } from '@/components/faq'
import { servicesFaqs } from '@/data/faqs'
import { CTABanner } from '@/components/cta-banner'

const services = [
  {
    id: 'whatsapp-lead',
    number: '01',
    title: 'WhatsApp Lead Automation',
    description: 'Capture, qualify, and respond to leads instantly on WhatsApp — the channel your customers already use. No app downloads, no friction.',
    icon: MessageSquare,
    accent: '#17A063',
    features: ['Auto-reply within seconds', 'Smart lead qualification', 'CRM sync', 'Multi-agent inbox'],
    howItWorks: 'We connect your WhatsApp Business account to an AI that reads every inbound message, matches it against your qualification criteria, and replies — or routes to the right person with full context. All conversations log to your CRM automatically.',
    metric: '40s',
    metricLabel: 'avg response time',
    tags: ['whatsapp', 'lead', 'chat', 'messaging', 'crm'],
  },
  {
    id: 'email-workflow',
    number: '02',
    title: 'Email Workflow Automation',
    description: 'Stop forwarding, copying, and chasing. Emails route, sort, and trigger actions automatically.',
    icon: Mail,
    accent: '#D9B36A',
    features: ['Auto-sort & label', 'Template responses', 'Follow-up sequences', 'Escalation routing'],
    howItWorks: 'Your inbox connects to a classification layer that reads intent, priority, and context. Routine requests get instant template replies; complex ones route to the right person with relevant thread history attached. Follow-ups fire automatically until resolved.',
    metric: '90%',
    metricLabel: 'auto-resolved rate',
    tags: ['email', 'workflow', 'automation', 'sorting', 'follow-up'],
  },
  {
    id: 'support-chat',
    number: '03',
    title: 'Support Chat Systems',
    description: 'AI-powered chat that answers FAQs instantly and hands off to your team when it gets complex.',
    icon: Headphones,
    accent: '#17A063',
    features: ['Instant FAQ answers', 'Human handoff with context', 'Ticket auto-creation', 'Sentiment detection'],
    howItWorks: 'Embed a chat widget or connect your existing live chat. An AI layer answers common questions from your knowledge base, escalates complex or sensitive issues to a human with the full transcript, and creates tickets in your helpdesk automatically.',
    metric: '<5s',
    metricLabel: 'first reply time',
    tags: ['support', 'chat', 'helpdesk', 'faq', 'ticketing'],
  },
  {
    id: 'booking-scheduling',
    number: '04',
    title: 'Booking & Scheduling Bots',
    description: 'Clients book against live availability — no phone tag, no double-booking, no-show reminders included.',
    icon: CalendarCheck,
    accent: '#D9B36A',
    features: ['Live calendar sync', 'Auto reminders', 'Reschedule handling', 'Buffer & block logic'],
    howItWorks: 'A conversational bot checks real-time availability, books slots, and sends calendar invites. Automated SMS/email reminders fire before appointments. Reschedules and cancellations update your calendar instantly without human intervention.',
    metric: '40%',
    metricLabel: 'fewer no-shows',
    tags: ['booking', 'scheduling', 'calendar', 'appointments', 'reminders'],
  },
  {
    id: 'invoice-order',
    number: '05',
    title: 'Invoice & Order Automation',
    description: 'Orders, invoices, and payments sync without a spreadsheet in sight. No manual entry, no reconciliation headaches.',
    icon: FileText,
    accent: '#17A063',
    features: ['Auto invoice generation', 'Payment matching', 'Order-to-CRM sync', 'Overdue follow-ups'],
    howItWorks: 'When an order comes in (web, email, or form), the system creates the invoice, matches payment against it, updates your books, and sends the customer a status update — all without a human touching it. Overdue invoices trigger graduated reminder sequences.',
    metric: '12hrs',
    metricLabel: 'saved per week',
    tags: ['invoice', 'order', 'payment', 'accounting', 'quickbooks'],
  },
  {
    id: 'custom-integration',
    number: '06',
    title: 'Custom Integration Builds',
    description: 'The tool you need doesn\'t connect to the tool you have? We build the bridge — no rip-and-replace required.',
    icon: Puzzle,
    accent: '#D9B36A',
    features: ['API connectors', 'Custom data sync', 'Legacy tool bridging', 'Webhook automation'],
    howItWorks: 'We audit your existing stack, identify the integration gaps, and build tailored connectors — whether it\'s a two-way sync between your CRM and accounting tool, a custom webhook chain, or bridging a legacy system to modern APIs.',
    metric: 'Any stack',
    metricLabel: 'we connect it',
    tags: ['integration', 'api', 'custom', 'connector', 'sync'],
  },
]

const integrations = [
  { name: 'WhatsApp', icon: '💬' }, { name: 'Gmail', icon: '📧' }, { name: 'Outlook', icon: '📨' },
  { name: 'HubSpot', icon: '🔶' }, { name: 'Salesforce', icon: '⚡' }, { name: 'Airtable', icon: '🔷' },
  { name: 'Notion', icon: '📝' }, { name: 'Slack', icon: '💬' }, { name: 'Shopify', icon: '🛒' },
  { name: 'QuickBooks', icon: '📊' }, { name: 'Calendly', icon: '📅' }, { name: 'Zapier', icon: '⚡' },
  { name: 'Make', icon: '🔗' }, { name: 'n8n', icon: '🔧' }, { name: 'Stripe', icon: '💳' },
  { name: 'DocuSign', icon: '✍️' }, { name: 'Google Sheets', icon: '📗' }, { name: 'Anthropic', icon: '🤖' },
]

function PageHero() {
  return (
    <section
      className="relative py-24 md:py-32 px-5 md:px-8 overflow-hidden"
      style={{ background: '#0A120E' }}
      aria-label="Services page header"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(860px 480px at 50% -8%, rgba(23,160,99,.15), transparent 62%)' }}
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
            Every system we build
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#D9B36A',
              boxShadow: '0 0 6px rgba(217,179,106,.6)',
              animation: 'valuePulse 2s ease-in-out infinite',
            }}
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            font: '700 clamp(2.2rem,5.5vw,4rem)/1.1 "Space Grotesk",sans-serif',
            color: '#F5F0E8',
            letterSpacing: '-.03em',
            maxWidth: '800px',
            margin: '0 auto 20px',
          }}
        >
          Six automations. One outcome: your time back.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            font: '400 17px/1.65 "Instrument Sans",sans-serif',
            color: 'rgba(245,240,232,.64)',
            maxWidth: '620px',
            margin: '0 auto',
          }}
        >
          Each module is scoped to your workflow and connects to the tools you already use. No packages, no platform lock-in.
        </motion.p>
      </div>
    </section>
  )
}

function ServicesSearch() {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return services
    const q = query.toLowerCase()
    return services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q))
    )
  }, [query])

  return (
    <div className="max-w-xl mx-auto mb-14">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A857B' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          className="w-full border rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all duration-200"
          style={{
            background: '#fff',
            borderColor: 'rgba(13,58,49,.14)',
            color: '#0A120E',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#17A063'
            e.target.style.boxShadow = '0 0 0 3px rgba(23,160,99,.12)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(13,58,49,.14)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>
      {query.trim() && (
        <div className="mt-3 text-xs text-center" style={{ color: '#5B6355' }}>
          {results.length === 0
            ? 'No matching services — every build is custom-scoped, ask us on a discovery call.'
            : `${results.length} matching service${results.length === 1 ? '' : 's'}`}
        </div>
      )}
    </div>
  )
}

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = service.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
        border: '1px solid rgba(13,58,49,.14)',
        borderRadius: '22px',
      }}
    >
      <div
        className="w-full h-1"
        style={{
          background: service.accent === '#17A063'
            ? 'linear-gradient(90deg,#17A063,#2BD483)'
            : 'linear-gradient(90deg,#D9B36A,#E7C57E)',
        }}
      />

      <div className="p-7 md:p-8">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: service.accent === '#17A063'
                  ? 'rgba(23,160,99,.1)'
                  : 'rgba(217,179,106,.12)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: service.accent }} />
            </div>
            <span
              style={{
                font: '700 11px "Instrument Sans",sans-serif',
                letterSpacing: '.1em',
                color: '#5B6355',
              }}
            >
              MODULE {service.number}
            </span>
          </div>
        </div>

        <h3
          style={{
            font: '600 20px/1.2 "Space Grotesk",sans-serif',
            color: '#0A120E',
            marginBottom: '8px',
          }}
        >
          {service.title}
        </h3>

        <p
          style={{
            font: '400 14.5px/1.6 "Instrument Sans",sans-serif',
            color: '#5B6355',
            marginBottom: '16px',
          }}
        >
          {service.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {service.features.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: service.accent === '#17A063'
                  ? 'rgba(23,160,99,.08)'
                  : 'rgba(217,179,106,.1)',
                color: service.accent,
                border: `1px solid ${service.accent === '#17A063' ? 'rgba(23,160,99,.18)' : 'rgba(217,179,106,.2)'}`,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        <div
          className="rounded-xl overflow-hidden mb-5 transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg,rgba(10,18,14,.03),rgba(10,18,14,.06))',
            border: '1px solid rgba(13,58,49,.08)',
          }}
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span
              style={{
                font: '600 13px "Instrument Sans",sans-serif',
                color: '#0A120E',
              }}
            >
              How it works
            </span>
            <ChevronDown
              className="w-4 h-4 shrink-0 transition-transform duration-300"
              style={{ color: '#8A857B', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{
              maxHeight: expanded ? '300px' : '0px',
              opacity: expanded ? 1 : 0,
            }}
          >
            <div className="px-4 pb-4">
              <p
                style={{
                  font: '400 13.5px/1.65 "Instrument Sans",sans-serif',
                  color: '#5B6355',
                }}
              >
                {service.howItWorks}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: 'linear-gradient(135deg,#0A120E,#0E241A)',
            border: '1px solid rgba(245,240,232,.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                font: '700 24px/1 "Space Grotesk",sans-serif',
                color: service.accent === '#17A063' ? '#2BD483' : '#D9B36A',
              }}
            >
              {service.metric}
            </span>
            <span
              style={{
                font: '400 13px "Instrument Sans",sans-serif',
                color: 'rgba(245,240,232,.55)',
              }}
            >
              {service.metricLabel}
            </span>
          </div>
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 group/link"
          style={{ color: service.accent }}
        >
          <span>Get this system</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  )
}

function IntegrationsSection() {
  return (
    <section
      className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0A120E' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(860px 420px at 50% 50%, rgba(23,160,99,.06), transparent 62%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto">
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
              Tool-agnostic by design
            </span>
          </span>
          <h2
            style={{
              font: '700 clamp(1.75rem,4vw,2.75rem)/1.12 "Space Grotesk",sans-serif',
              color: '#F5F0E8',
              letterSpacing: '-.02em',
              maxWidth: '600px',
              margin: '0 auto 16px',
            }}
          >
            Your stack, connected.
          </h2>
          <p
            style={{
              font: '400 16px/1.65 "Instrument Sans",sans-serif',
              color: 'rgba(245,240,232,.55)',
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            We work with everything you already use — no forced migrations, no new logins to learn.
          </p>
        </div>

        <div className="space-y-4 overflow-hidden">
          <div
            className="flex gap-4"
            style={{
              animation: 'marqueeL 40s linear infinite',
              width: 'max-content',
            }}
          >
            {[...integrations, ...integrations].map((tool, i) => (
              <div
                key={`row1-${i}`}
                className="flex items-center gap-3 px-5 py-3 rounded-xl whitespace-nowrap shrink-0"
                style={{
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{tool.icon}</span>
                <span
                  style={{
                    font: '500 14px "Instrument Sans",sans-serif',
                    color: 'rgba(245,240,232,.78)',
                  }}
                >
                  {tool.name}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex gap-4"
            style={{
              animation: 'marqueeR 40s linear infinite',
              width: 'max-content',
            }}
          >
            {[...integrations, ...integrations].map((tool, i) => (
              <div
                key={`row2-${i}`}
                className="flex items-center gap-3 px-5 py-3 rounded-xl whitespace-nowrap shrink-0"
                style={{
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{tool.icon}</span>
                <span
                  style={{
                    font: '500 14px "Instrument Sans",sans-serif',
                    color: 'rgba(245,240,232,.78)',
                  }}
                >
                  {tool.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ServicesPage() {
  return (
    <>
      <PageHero />
      <div className="pt-16 px-5" style={{ background: '#F7F2EA' }}>
        <ServicesSearch />
        <section className="max-w-6xl mx-auto pb-24 md:pb-32">
          <BentoGrid>
            {services.map((service, i) => (
              <BentoCard key={service.id} span={i === 0 ? 12 : 6} className="border-0 p-0 shadow-none hover:translate-y-0">
                <ServiceCard service={service} index={i} />
              </BentoCard>
            ))}
          </BentoGrid>
        </section>
      </div>
      <IntegrationsSection />
      <FAQ items={servicesFaqs} title="Services FAQ" />
      <CTABanner />
    </>
  )
}
