'use client'

import { Search, ClipboardCheck, FileText, Hammer, TestTube2, Handshake, LifeBuoy } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const steps = [
  { number: '01', title: 'Discovery', description: 'We sit down with you to map every manual process and find the highest-ROI automation opportunities.', icon: Search },
  { number: '02', title: 'Audit', description: 'We audit your existing tools and workflows in detail — no assumptions about what you already use.', icon: ClipboardCheck },
  { number: '03', title: 'Proposal', description: 'You get a clear, fixed-scope proposal: exactly what gets built, what it connects to, and the timeline.', icon: FileText },
  { number: '04', title: 'Build', description: 'We build and connect every piece — AI models, APIs, triggers, and actions — tested end to end.', icon: Hammer },
  { number: '05', title: 'Testing', description: 'We run real traffic through the system, monitor every outcome, and tune until it is bulletproof.', icon: TestTube2 },
  { number: '06', title: 'Handoff', description: 'The system ships live with full documentation — it is yours, not a black box you depend on us for.', icon: Handshake },
  { number: '07', title: 'Support', description: 'Included support window after launch to catch edge cases and fine-tune based on real usage.', icon: LifeBuoy },
]

export function ProcessTimeline() {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <section className="py-[var(--space-section)] section-light relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #2A6B5A 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden="true" />
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-6 relative z-10">
        <div className="text-center mb-16">
          <span data-reveal className="section-label-pill">The full process</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">Discovery to handoff, one connected path.</h2>
        </div>

        <div ref={sectionRef} className="relative">
          <div className="hidden md:block absolute left-[35px] top-0 bottom-0 w-0.5 rounded-full" style={{ background: 'linear-gradient(180deg, #2A6B5A 0%, #C8A96E 50%, #2A6B5A 100%)' }} aria-hidden="true" />

          <div className="flex flex-col gap-10">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} data-reveal className="relative flex gap-6 items-start">
                  <div className="relative z-10 shrink-0 w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #2A6B5A 0%, #3D8B71 100%)' }}>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                      style={{ background: '#C8A96E', color: '#1C1612' }}>
                      {step.number}
                    </div>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="glass-card rounded-2xl p-6 flex-1">
                    <h3 className="font-heading text-lg font-bold text-[#1C1612] mb-2">{step.title}</h3>
                    <p className="text-[#6B6155] text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProcessNoPricingCallout() {
  return (
    <section className="py-16 bg-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="glass-card-featured rounded-2xl p-8 md:p-10 text-center">
          <span className="section-label-pill">No generic pricing packages</span>
          <h3 className="text-2xl md:text-3xl font-bold text-[#1C1612] mt-5 mb-4">Every build gets a fixed quote, not a plan tier.</h3>
          <p className="text-[#6B6155] leading-relaxed max-w-xl mx-auto">
            There is no menu of packages to pick from. After discovery and audit, you get a clear proposal — fixed scope, fixed timeline — based on what your business actually needs.
          </p>
        </div>
      </div>
    </section>
  )
}
