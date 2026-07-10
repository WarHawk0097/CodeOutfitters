'use client'

import { useState } from 'react'
import { Home, ShoppingBag, HeartPulse, ArrowRight } from 'lucide-react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export const cases = [
  {
    icon: Home, industry: 'Real Estate', tag: 'WhatsApp Automation', number: '01', accent: '#2A6B5A',
    title: 'A 3-person agency doubled lead response with an always-on WhatsApp system.',
    problem: 'A real estate office was losing leads to faster competitors. Manual follow-ups took hours every day.',
    solution: 'We deployed an AI WhatsApp bot that qualifies, responds, and books viewings 24/7 — integrated with their CRM.',
    results: [
      { metric: '2x', label: 'Lead Response Rate' },
      { metric: '67%', label: 'Fewer Manual Follow-ups' },
      { metric: '18 hrs', label: 'Saved Per Week' },
    ],
  },
  {
    icon: ShoppingBag, industry: 'E-commerce', tag: 'Invoice Automation', number: '02', accent: '#3D8B71',
    title: 'Invoice processing: 4 hours → 8 minutes daily.',
    problem: 'An online retailer manually created invoices and reconciled orders every day.',
    solution: 'Our automation pipeline handles 200+ invoices per day, error-free, across their entire product catalog.',
    results: [
      { metric: '97%', label: 'Time Saved' },
      { metric: '0', label: 'Errors' },
      { metric: '200+/day', label: 'Invoices Processed' },
    ],
  },
  {
    icon: HeartPulse, industry: 'Healthcare', tag: 'Booking Bot', number: '03', accent: '#C8A96E',
    title: 'Medical clinic eliminated 90% of phone-based scheduling.',
    problem: 'A busy clinic was overwhelmed by appointment calls, losing patients to long hold times.',
    solution: 'AI booking bot that syncs with their calendar and sends automatic reminders.',
    results: [
      { metric: '90%', label: 'Fewer Calls' },
      { metric: '40%', label: 'Drop in No-Shows' },
      { metric: '24/7', label: 'Booking' },
    ],
  },
]

export function Portfolio({ hideHeader = false, filterable = false }: { hideHeader?: boolean; filterable?: boolean }) {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.1)
  const [industryFilter, setIndustryFilter] = useState<string>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const industries = ['All', ...Array.from(new Set(cases.map((c) => c.industry)))]
  const visible = industryFilter === 'All' ? cases : cases.filter((c) => c.industry === industryFilter)
  const featured = visible[0]
  const rest = visible.slice(1)

  return (
    <section id="portfolio" className="py-24 md:py-32 px-5 md:px-8 bg-[#F5F0EB] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #2A6B5A 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        {!hideHeader && (
          <div className="text-center mb-10">
            <span data-reveal className="section-label-pill">PROOF WALL</span>
            <h2 data-reveal className="text-[var(--text-h2)] text-[#1C1612] font-extrabold mt-5 mb-5 max-w-3xl mx-auto leading-tight">
              Real businesses. <span className="text-gradient">Measurable results.</span>
            </h2>
            <p data-reveal className="text-[#6B6155] text-lg leading-relaxed max-w-2xl mx-auto">
              Every automation is measured by one thing: time and money saved for our clients.
            </p>
            <p className="text-xs text-[#9B9088] mt-3 italic">Illustrative case studies based on typical engagements.</p>
          </div>
        )}

        {filterable && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustryFilter(ind)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
                  industryFilter === ind
                    ? 'bg-[#2A6B5A] text-white border-[#2A6B5A]'
                    : 'bg-white text-[#6B6155] border-[rgba(28,22,18,0.1)] hover:border-[#2A6B5A]'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        )}

        <div ref={sectionRef} className="space-y-6 md:space-y-8">
          <div data-reveal className="bg-white rounded-2xl border border-[rgba(42,107,90,0.15)] overflow-hidden shadow-premium-lg">
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #2A6B5A, #3D8B71)' }} />
            <div className="p-8 md:p-10 lg:grid lg:grid-cols-5 lg:gap-10">
              <div className="lg:col-span-3">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.1em] text-[#6B6155] bg-[#F5F0EB] px-3 py-1 rounded-full inline-block">SYSTEM {featured.number}</span>
                    <h3 className="font-body text-xl md:text-2xl font-bold text-[#1C1612] mt-3 mb-4 leading-snug">{featured.title}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ml-3" style={{ background: `${featured.accent}12` }}>
                    <featured.icon className="w-7 h-7" style={{ color: featured.accent }} />
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap mb-5">
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-[rgba(28,22,18,0.1)] text-[#6B6155] uppercase tracking-wide">{featured.industry}</span>
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide border" style={{ background: `${featured.accent}10`, color: featured.accent, borderColor: `${featured.accent}25` }}>
                    {featured.tag}
                  </span>
                </div>

                <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(200,169,110,0.06)', borderLeft: '3px solid #C8A96E' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8A96E]">BEFORE</span>
                  <p className="text-[#6B6155] text-base leading-relaxed mt-1">{featured.problem}</p>
                </div>
                <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(42,107,90,0.06)', borderLeft: '3px solid #2A6B5A' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A6B5A]">AFTER</span>
                  <p className="text-[#6B6155] text-base leading-relaxed mt-1">{featured.solution}</p>
                </div>

                {featured && (
                  <button
                    onClick={() => setExpanded(expanded === featured.title ? null : featured.title)}
                    className="inline-flex items-center gap-1.5 text-base font-semibold text-[#2A6B5A] hover:text-[#1A4A3B] transition-colors duration-200"
                  >
                    {expanded === featured.title ? 'Hide full story' : 'Read full case study'} <ArrowRight className={`w-4 h-4 transition-transform ${expanded === featured.title ? 'rotate-90' : ''}`} />
                  </button>
                )}
                {featured && expanded === featured.title && (
                  <p className="mt-4 text-sm text-[#6B6155] leading-relaxed border-t border-[rgba(28,22,18,0.08)] pt-4">
                    {featured.problem} {featured.solution}
                  </p>
                )}
              </div>

              <div className="lg:col-span-2 mt-8 lg:mt-0 grid grid-cols-3 gap-4 content-start">
                {featured.results.map((r) => (
                  <div key={r.label} className="rounded-2xl p-5 md:p-6 text-center shadow-premium" style={{ background: `${featured.accent}08` }}>
                    <div className="text-2xl md:text-3xl font-bold font-mono" style={{ color: featured.accent }}>{r.metric}</div>
                    <span className="text-xs text-[#6B6155] leading-tight block mt-1.5 font-medium">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {rest.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.title} data-reveal
                  className="group relative bg-white rounded-2xl border border-[rgba(28,22,18,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-premium hover:shadow-premium-lg">
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${c.accent}, ${c.accent}88)` }} />
                  <div className="p-6 md:p-7">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[11px] font-semibold tracking-[0.1em] text-[#6B6155] bg-[#F5F0EB] px-2.5 py-1 rounded-full">SYSTEM {c.number}</span>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 transition-transform duration-300 group-hover:scale-110" style={{ background: `${c.accent}12` }}>
                        <Icon className="w-5 h-5" style={{ color: c.accent }} />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[rgba(28,22,18,0.1)] text-[#6B6155] uppercase tracking-wide">
                        {c.industry}
                      </span>
                    </div>
                    <h3 className="font-body text-base font-bold text-[#1C1612] mb-3 leading-snug">{c.title}</h3>
                    <p className="text-[#6B6155] text-sm leading-relaxed mb-4">{c.problem}</p>
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[rgba(28,22,18,0.06)] mb-3">
                      {c.results.map((r) => (
                        <div key={r.label} className="text-center">
                          <div className="text-base font-bold font-mono" style={{ color: c.accent }}>{r.metric}</div>
                          <span className="text-[10px] text-[#6B6155] leading-tight block mt-0.5 font-medium">{r.label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === c.title ? null : c.title)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 hover:gap-2"
                      style={{ color: c.accent }}
                    >
                      {expanded === c.title ? 'Hide story' : 'Read case study'}
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {expanded === c.title && (
                      <p className="mt-3 text-xs text-[#6B6155] leading-relaxed border-t border-[rgba(28,22,18,0.06)] pt-3">
                        {c.solution}
                      </p>
                    )}
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
