'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import { ShieldCheck, Users2, FileCheck, Lock } from 'lucide-react'

const trustCards = [
  { icon: ShieldCheck, title: 'You own everything', desc: 'No proprietary platform. Every workflow, credential, and integration is yours after handoff.' },
  { icon: Users2, title: 'Small business focus', desc: 'We work with US small businesses — real constraints, real margins, no enterprise sales theater.' },
  { icon: FileCheck, title: 'Documented handoff', desc: 'Every system ships with documentation so you are never dependent on us to understand it.' },
  { icon: Lock, title: 'Least-access by default', desc: 'We request only the access a build needs, and remove it when the engagement ends.' },
]

const howWeWork = [
  { step: 'Discovery first', desc: 'We learn your actual workflow before proposing anything — no template pitch.' },
  { step: 'Fixed scope, fixed quote', desc: 'You see exactly what gets built and what it costs before we start.' },
  { step: 'Build in the open', desc: 'You see progress during the build, not just a reveal at the end.' },
  { step: 'Handoff, not lock-in', desc: 'The system is yours — documented, owned, and not dependent on us to keep running.' },
]

export function AboutMission() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] section-light relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-6 text-center">
        <span data-reveal className="section-label-pill">Our studio</span>
        <h1 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5 mb-6">
          We build automation studios treat as infrastructure, not a project.
        </h1>
        <p data-reveal className="text-[#6B6155] text-lg leading-relaxed">
          CodeOutfitters exists to remove the manual busywork that quietly eats a small business's week — missed calls, duplicate data entry, chased-down follow-ups. We scope every build around your actual workflow, ship it fast, and hand it off fully documented and fully yours.
        </p>
      </div>

      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-6 mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trustCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.title} data-reveal className="glass-card p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-[#2A6B5A]" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#1C1612] mb-2">{c.title}</h3>
              <p className="text-[#6B6155] text-sm leading-relaxed">{c.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function AboutHowWeWork() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">How we work</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">Four principles behind every build.</h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {howWeWork.map((h, i) => (
            <div key={h.step} data-reveal className="flex gap-4 glass-card p-6 rounded-2xl">
              <span className="shrink-0 text-2xl font-heading font-bold text-[#C8A96E]">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-heading text-base font-semibold text-[#1C1612] mb-1">{h.step}</h3>
                <p className="text-sm text-[#6B6155] leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
