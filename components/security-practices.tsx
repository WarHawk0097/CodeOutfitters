'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import { KeyRound, ServerCog, UserCheck, FlaskConical, FileCheck2, Activity } from 'lucide-react'

const accessSecrets = [
  { icon: KeyRound, title: 'Least-access setup', desc: 'Every integration is connected with scoped or dedicated accounts wherever the platform supports it — not broad admin access by default.' },
  { icon: ServerCog, title: 'Server-side secrets', desc: 'API keys and credentials live server-side, never shipped to the browser or committed to a repo.' },
]

const guardrails = [
  { icon: UserCheck, title: 'Human review for sensitive workflows', desc: 'Chatbots and AI agents handle routine replies, but anything involving money, cancellations, or ambiguous requests is routed to a person by design — not left to the model’s best guess.' },
  { icon: FlaskConical, title: 'Testing before launch', desc: 'Before anything goes live, we run it against real messages, edge cases, and failure paths — including what happens when an integration is slow or down.' },
]

const reliability = [
  { icon: Activity, title: 'Monitoring mindset', desc: 'We check in on live automations during the support window and flag anything behaving unexpectedly before it becomes your problem.' },
  { icon: FileCheck2, title: 'Documented handoff', desc: 'Every project ends with documentation of what was built, how it works, and who to contact — not tribal knowledge.' },
]

export function SecurityAccessSecrets() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">Access &amp; secrets</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">How we handle access, secrets, and reliability.</h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {accessSecrets.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.title} data-reveal className="glass-card p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#2A6B5A]" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#1C1612] mb-2">{c.title}</h3>
                <p className="text-sm text-[#6B6155] leading-relaxed">{c.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function SecurityGuardrails() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] relative overflow-hidden" style={{ background: '#0E241A' }}>
      <div ref={ref} className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {guardrails.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.title} data-reveal className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#2BD483]" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#F5F0E8]">{c.title}</h3>
              <p className="text-sm text-[rgba(245,240,232,0.62)] leading-relaxed">{c.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function SecurityReliabilityHandoff() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] section-tinted relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">Reliability &amp; handoff</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">You are never dependent on us to understand it.</h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {reliability.map((c) => {
            const Icon = c.icon
            return (
              <div key={c.title} data-reveal className="glass-card p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#2A6B5A]" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#1C1612] mb-2">{c.title}</h3>
                <p className="text-sm text-[#6B6155] leading-relaxed">{c.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
