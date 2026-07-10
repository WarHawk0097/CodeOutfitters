'use client'

import { Search, FileCode, Bot, Link2, TestTube, RefreshCw } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const steps = [
  { number: '01', title: 'Discovery', description: 'We audit your operations, map every manual process, and identify the highest-ROI automation opportunities.', takeaway: 'Know exactly where you are losing time.', icon: Search },
  { number: '02', title: 'Workflow Design', description: 'We architect the automation blueprint — integrations, data flow, decision trees, and fallback logic.', takeaway: 'A clear visual plan before any code.', icon: FileCode },
  { number: '03', title: 'Build', description: 'We build and connect every piece: AI models, APIs, triggers, and actions — tested end to end.', takeaway: 'Your automation running in sandbox.', icon: Bot },
  { number: '04', title: 'Connect', description: 'We integrate with your existing tools — CRMs, calendars, email, SMS, analytics — so everything talks.', takeaway: 'Unified system, no manual transfers.', icon: Link2 },
  { number: '05', title: 'Test Live', description: 'We run real traffic through the automation, monitor every outcome, and tune until bulletproof.', takeaway: 'Production-ready, handling real workflows.', icon: TestTube },
  { number: '06', title: 'Optimize', description: 'Every month we review performance, add improvements, and evolve your automation as you grow.', takeaway: 'Gets better over time, never stale.', icon: RefreshCw },
]

export function Process() {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.1)

  return (
    <section id="process" className="section-light py-24 md:py-32 px-5 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #2A6B5A 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <span data-reveal className="section-label-pill">BUILD PIPELINE</span>
          <h2 data-reveal className="text-[var(--text-h2)] text-[#1C1612] font-extrabold mt-5 mb-5 max-w-3xl mx-auto leading-tight">
            From discovery to <span className="text-gradient">deployed in 7 days</span>
          </h2>
          <p data-reveal className="text-[#6B6155] text-lg leading-relaxed max-w-2xl mx-auto">
            A streamlined pipeline designed to minimize your time investment while maximizing results.
          </p>
        </div>

        <div ref={sectionRef} className="relative">
          <div className="hidden lg:block absolute left-[calc(8.33%+4px)] right-[calc(8.33%+4px)] top-[62px] h-1.5 pointer-events-none rounded-full" style={{ background: 'linear-gradient(90deg, #2A6B5A 0%, #C8A96E 40%, #3D8B71 70%, #2A6B5A 100%)', boxShadow: '0 0 12px rgba(42,107,90,0.2)' }} aria-hidden="true" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.number} data-reveal className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center mb-5 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #2A6B5A 0%, #3D8B71 100%)' }}>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                      style={{ background: '#C8A96E', color: '#1C1612' }}>
                      {step.number}
                    </div>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="font-body text-lg font-bold text-[#1C1612] mb-3">{step.title}</h3>
                  <p className="text-[#6B6155] text-sm leading-relaxed mb-4 max-w-[220px]">{step.description}</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#2A6B5A] mt-auto pt-4 border-t border-[rgba(28,22,18,0.08)] w-full max-w-[200px]">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                    {step.takeaway}
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
