'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import { PhoneCall, ClipboardList, FileText } from 'lucide-react'

const steps = [
  { icon: PhoneCall, title: 'Discovery call', desc: 'A short call to map your current workflow and where time is being lost.' },
  { icon: ClipboardList, title: 'Free workflow audit', desc: 'We identify your top automation opportunities at no cost, no obligation.' },
  { icon: FileText, title: 'Fixed proposal', desc: 'A clear scope, timeline, and quote — no generic packages, no surprise costs.' },
]

const trustChips = ['No spam, ever', 'No obligation', 'Response within 4 hours', 'You own everything we build']

export function ContactNextSteps() {
  const ref = useScrollReveal<HTMLDivElement>(0.1)
  return (
    <section className="py-[var(--space-section)] bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-6">
        <div className="text-center mb-12">
          <span data-reveal className="section-label-pill">What happens next</span>
          <h2 data-reveal className="text-3xl md:text-4xl font-bold text-[#1C1612] mt-5">Three steps, no pressure.</h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.title} data-reveal className="glass-card p-6 rounded-2xl text-center">
                <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#2A6B5A]" />
                </div>
                <span className="text-xs font-semibold text-[#C8A96E] uppercase tracking-wide">Step {i + 1}</span>
                <h3 className="font-heading text-base font-bold text-[#1C1612] mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-[#6B6155] leading-relaxed">{s.desc}</p>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {trustChips.map((chip) => (
            <span key={chip} className="text-xs font-medium px-4 py-2 rounded-full bg-[#F5F0EB] text-[#6B6155]">{chip}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
