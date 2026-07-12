'use client'

import { motion } from 'framer-motion'
import { KeyRound, ServerCog, UserCheck, FlaskConical, Activity, FileCheck2, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const accessItems = [
  {
    icon: KeyRound, title: 'Least-access setup', span: 12, featured: true,
    desc: 'Every integration is connected with scoped or dedicated accounts wherever the platform supports it — not broad admin access by default. If integration permissions allow read-only, that\'s what we use.',
  },
  {
    icon: ServerCog, title: 'Server-side secrets', span: 6, featured: false,
    desc: 'API keys and credentials live server-side, never shipped to the browser or committed to a repo.',
  },
  {
    icon: UserCheck, title: 'Scoped account access', span: 6, featured: false,
    desc: 'We create integration-specific accounts rather than sharing personal credentials. When the engagement ends, access is revoked — nothing lingers.',
  },
]

const guardrailItems = [
  {
    title: 'Human review for sensitive workflows',
    desc: 'Chatbots and AI agents handle routine replies, but anything involving money, cancellations, or ambiguous requests is routed to a person by design — not left to the model\'s best guess.',
  },
  {
    title: 'Real scenarios, not a demo script',
    desc: 'We test against your actual data patterns — edge cases, slow integrations, malformed inputs — before anything touches real customers.',
  },
]

const reliabilityItems = [
  {
    icon: Activity, title: 'Monitoring mindset', span: 6,
    desc: 'We check in on live automations during the support window and flag anything behaving unexpectedly before it becomes your problem.',
  },
  {
    icon: FileCheck2, title: 'Documented handoff', span: 6,
    desc: 'Every project ends with documentation of what was built, how it works, and who to contact — not tribal knowledge.',
  },
  {
    icon: KeyRound, title: 'Clear rollback plan', span: 12, featured: true,
    desc: 'Every system includes a documented rollback path. If you need to pause or undo an automation, you can — no guesswork, no vendor call.',
  },
]

const integrationLogos = [
  'HubSpot', 'Airtable', 'Google Sheets', 'Notion', 'Slack',
  'WhatsApp', 'Gmail', 'Twilio', 'Shopify', 'Stripe',
  'QuickBooks', 'Calendly', 'Google Calendar',
]

function SecurityHero() {
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
            Security &amp; reliability
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.1] text-[#F5F0E8] -tracking-[.02em] mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Built with a <span style={{ color: '#2BD483' }}>security-conscious</span> mindset.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg leading-relaxed max-w-2xl mx-auto"
          style={{ color: 'rgba(245,240,232,.62)' }}
        >
          Automation touches sensitive parts of your business — your leads, your calendar, your payments.
          Here is how we handle it on every build.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs mt-6"
          style={{ color: 'rgba(245,240,232,.35)' }}
        >
          We are not SOC 2, HIPAA, or ISO certified. If those are requirements for your business,
          we will be straightforward about whether we can meet them.
        </motion.p>
      </div>
    </section>
  )
}

function AccessSecretsBento() {
  const ref = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative" style={{ background: '#fff' }}>
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
            Access &amp; secrets
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
          >
            How access and credentials are handled
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {accessItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                data-reveal
                className={`col-span-1 md:col-span-${item.span} rounded-[22px] p-7 md:p-8 transition-all duration-300 hover:-translate-y-0.5`}
                style={{
                  background: item.featured
                    ? 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)'
                    : 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
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
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5B6355' }}>{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AIGuardrails() {
  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0E241A' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(540px 340px at 50% 50%, rgba(23,160,99,.08), transparent 60%)' }}
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
            AI guardrails
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em] mt-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
          >
            Designed so AI augments, not replaces, judgment
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {guardrailItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(43,212,131,.12)' }}
              >
                <FlaskConical className="w-5 h-5" style={{ color: '#2BD483' }} />
              </div>
              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,.55)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ReliabilityHandoff() {
  const ref = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <section className="py-20 md:py-28 px-5 md:px-8 relative" style={{ background: '#fff' }}>
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
            Reliability &amp; handoff
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
          >
            You are never dependent on us to understand it
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {reliabilityItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                data-reveal
                className={`col-span-1 md:col-span-${item.span} rounded-[22px] p-7 md:p-8 transition-all duration-300 hover:-translate-y-0.5`}
                style={{
                  background: item.featured
                    ? 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)'
                    : 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
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
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5B6355' }}>{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function IntegrationsMarquee() {
  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0E241A' }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-4"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            Security integrations
          </span>
          <h2
            className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.15] -tracking-[.02em]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
          >
            Platforms we connect — securely
          </h2>
        </motion.div>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div
          className="marquee-track"
          style={{
            display: 'flex', gap: '14px', width: 'max-content',
            animation: 'securityMarquee 48s linear infinite',
          }}
        >
          {integrationLogos.map((name) => (
            <div key={name}
              className="flex items-center gap-3 px-5 py-3 rounded-xl whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                transition: 'background .2s, border-color .2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                e.currentTarget.style.borderColor = 'rgba(217,179,106,.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
              }}
            >
              <img
                src={`/assets/integrations/${name.toLowerCase().replace(/\s+/g, '-')}.svg`}
                alt={name} width={20} height={20}
                className="w-5 h-5 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-sm font-medium" style={{ color: 'rgba(245,240,232,.7)' }}>{name}</span>
            </div>
          ))}
          {integrationLogos.map((name) => (
            <div key={`dup-${name}`}
              className="flex items-center gap-3 px-5 py-3 rounded-xl whitespace-nowrap"
              style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                transition: 'background .2s, border-color .2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.08)'
                e.currentTarget.style.borderColor = 'rgba(217,179,106,.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
              }}
            >
              <img
                src={`/assets/integrations/${name.toLowerCase().replace(/\s+/g, '-')}.svg`}
                alt={name} width={20} height={20}
                className="w-5 h-5 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <span className="text-sm font-medium" style={{ color: 'rgba(245,240,232,.7)' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes securityMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-16 md:py-20 px-5 md:px-8 relative overflow-hidden" style={{ background: '#F7F2EA' }}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.15] -tracking-[.02em] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
        >
          Want to discuss your security requirements?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-base leading-relaxed mb-8"
          style={{ color: '#5B6355' }}
        >
          We are transparent about what we do and don&apos;t support. If your business has specific
          compliance needs, tell us on the discovery call.
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

export function SecurityPageClient() {
  return (
    <>
      <SecurityHero />
      <AccessSecretsBento />
      <AIGuardrails />
      <ReliabilityHandoff />
      <IntegrationsMarquee />
      <CTASection />
    </>
  )
}
