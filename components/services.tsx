'use client'

import { MessageSquare, CalendarCheck, Workflow, Users, TrendingUp, ShoppingCart, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const featured = {
  number: '01',
  title: 'AI Helpdesk',
  problem: 'Your team spends hours answering the same questions every day. Clients get frustrated waiting for replies.',
  workflow: 'AI classifies inbound messages, answers FAQs instantly, routes complex issues to the right person with full context — all in real time.',
  outcome: 'Support costs cut by 60%, response time drops from hours to seconds.',
  metric: '60%',
  metricLabel: 'faster response',
  icon: MessageSquare,
  accent: '#2A6B5A',
}

const supporting = [
  {
    number: '02', title: 'Booking Automation',
    problem: 'Endless back-and-forth to schedule calls.',
    outcome: 'No-shows drop 40%, bookings 24/7', icon: CalendarCheck, accent: '#C8A96E',
  },
  {
    number: '03', title: 'CRM Workflow',
    problem: 'Data entry eats hours your team could sell.',
    outcome: 'Sales teams reclaim 15+ hrs/week', icon: Workflow, accent: '#3D8B71',
  },
  {
    number: '04', title: 'Lead Capture',
    problem: 'Hot leads go cold waiting for a response.',
    outcome: 'Response time drops to seconds', icon: Users, accent: '#C8A96E',
  },
  {
    number: '05', title: 'Analytics Dashboard',
    problem: 'Spreadsheet chaos — no clear picture.',
    outcome: 'Know your numbers in 30 seconds', icon: TrendingUp, accent: '#2A6B5A',
  },
]

export function Services({ preview = false, hideHeader = false }: { preview?: boolean; hideHeader?: boolean }) {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.1)

  return (
    <section id="services" className="section-tinted py-24 md:py-32 px-5 md:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #2A6B5A 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        {!hideHeader && (
          <div className="text-center mb-16 md:mb-20">
            <span data-reveal className="section-label-pill">AUTOMATION OS</span>
            <h2 data-reveal className="text-[var(--text-h2)] text-[#1C1612] font-extrabold mt-5 mb-5 max-w-3xl mx-auto leading-tight">
              Your business runs on <span className="text-gradient">six core systems</span>
            </h2>
            <p data-reveal className="text-[#6B6155] text-lg leading-relaxed max-w-2xl mx-auto">
              Each module is custom-built for your stack — deployed in 7 days, zero code on your end.
            </p>
          </div>
        )}

        <div ref={sectionRef} className="space-y-6 md:space-y-8">
          <div data-reveal className="bg-white rounded-2xl border border-[rgba(42,107,90,0.15)] overflow-hidden shadow-premium-lg">
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #2A6B5A, #3D8B71)' }} />
            <div className="p-8 md:p-10 lg:grid lg:grid-cols-2 lg:gap-10">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.1em] text-[#6B6155] bg-[#F5F0EB] px-3 py-1 rounded-full">MODULE {featured.number}</span>
                <h3 className="font-body text-2xl md:text-3xl font-bold text-[#1C1612] mt-4 mb-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${featured.accent}12` }}>
                    <featured.icon className="w-6 h-6" style={{ color: featured.accent }} />
                  </div>
                  {featured.title}
                </h3>
                <p className="text-[#6B6155] text-base leading-relaxed mb-5">{featured.problem}</p>
                <div className="py-4 px-5 rounded-xl mb-5 text-base leading-relaxed" style={{ background: `${featured.accent}08`, borderLeft: `3px solid ${featured.accent}55` }}>
                  <span className="text-[10px] font-semibold tracking-wider uppercase block mb-1" style={{ color: featured.accent }}>We automate</span>
                  {featured.workflow}
                </div>
                <div className="flex items-center gap-2.5 font-semibold pt-4 border-t border-[rgba(28,22,18,0.06)]" style={{ color: featured.accent }}>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {featured.outcome}
                </div>
              </div>

              <div className="mt-8 lg:mt-0 flex items-center justify-center">
                <div className="w-full max-w-[360px] h-[220px] rounded-xl relative overflow-hidden shadow-premium" style={{ background: 'linear-gradient(145deg, rgba(42,107,90,0.08), rgba(42,107,90,0.02))', border: '1px solid rgba(42,107,90,0.12)' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 360 220" className="w-full h-full" aria-hidden="true">
                      <circle cx="60" cy="70" r="24" fill="rgba(42,107,90,0.1)" stroke="#2A6B5A" strokeWidth="1.5" />
                      <text x="60" y="65" textAnchor="middle" fill="#2A6B5A" fontSize="9" fontFamily="var(--font-body), sans-serif" fontWeight={600}>INPUT</text>
                      <text x="60" y="78" textAnchor="middle" fill="#2A6B5A" fontSize="7" fontFamily="var(--font-body), sans-serif" opacity={0.5}>Inquiry</text>

                      <circle cx="180" cy="70" r="20" fill="rgba(200,169,110,0.1)" stroke="#C8A96E" strokeWidth="1.5" />
                      <circle cx="180" cy="130" r="20" fill="rgba(61,139,113,0.1)" stroke="#3D8B71" strokeWidth="1.5" />
                      <text x="180" y="65" textAnchor="middle" fill="#C8A96E" fontSize="7" fontFamily="var(--font-body), sans-serif" fontWeight={600}>AI</text>
                      <text x="180" y="125" textAnchor="middle" fill="#3D8B71" fontSize="7" fontFamily="var(--font-body), sans-serif" fontWeight={600}>CRM</text>

                      <circle cx="300" cy="70" r="24" fill="rgba(42,107,90,0.1)" stroke="#2A6B5A" strokeWidth="1.5" />
                      <text x="300" y="65" textAnchor="middle" fill="#2A6B5A" fontSize="9" fontFamily="var(--font-body), sans-serif" fontWeight={600}>OUTPUT</text>
                      <text x="300" y="78" textAnchor="middle" fill="#2A6B5A" fontSize="7" fontFamily="var(--font-body), sans-serif" opacity={0.5}>Resolved</text>

                      {[
                        { x1: 84, y1: 70, x2: 160, y2: 70 },
                        { x1: 84, y1: 70, x2: 160, y2: 130 },
                        { x1: 200, y1: 70, x2: 276, y2: 70 },
                        { x1: 200, y1: 130, x2: 276, y2: 70 },
                      ].map((l, i) => (
                        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#C8A96E" strokeWidth="1.5" strokeDasharray="3 3">
                          <animate attributeName="strokeDashoffset" values="0;-24" dur="2s" repeatCount="indefinite" />
                        </line>
                      ))}

                      <rect x="84" y="60" width="24" height="20" rx="4" fill="rgba(200,169,110,0.15)" />
                      <text x="96" y="73" textAnchor="middle" fill="#C8A96E" fontSize="10" fontFamily="var(--font-mono), monospace" fontWeight={700}>AI</text>

                      <circle cx="180" cy="170" r="12" fill="rgba(42,107,90,0.15)" stroke="#2A6B5A" strokeWidth="1" />
                      <circle cx="260" cy="180" r="12" fill="rgba(61,139,113,0.15)" stroke="#3D8B71" strokeWidth="1" />
                      <circle cx="320" cy="165" r="12" fill="rgba(200,169,110,0.15)" stroke="#C8A96E" strokeWidth="1" />
                      <text x="180" y="174" textAnchor="middle" fill="#2A6B5A" fontSize="6" fontFamily="var(--font-mono), monospace">BP</text>
                      <text x="260" y="184" textAnchor="middle" fill="#3D8B71" fontSize="6" fontFamily="var(--font-mono), monospace">LC</text>
                      <text x="320" y="169" textAnchor="middle" fill="#C8A96E" fontSize="6" fontFamily="var(--font-mono), monospace">AN</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {(preview ? supporting.slice(0, 2) : supporting).map((mod) => {
              const Icon = mod.icon
              return (
                <div key={mod.title} data-reveal
                  className="group relative bg-white rounded-2xl border border-[rgba(28,22,18,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-premium hover:shadow-premium-lg">
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${mod.accent}, ${mod.accent}88)` }} />
                  <div className="p-6 md:p-7">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[11px] font-semibold tracking-[0.1em] text-[#6B6155] bg-[#F5F0EB] px-2.5 py-1 rounded-full">MODULE {mod.number}</span>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 transition-transform duration-300 group-hover:scale-110" style={{ background: `${mod.accent}12` }}>
                        <Icon className="w-5 h-5" style={{ color: mod.accent }} />
                      </div>
                    </div>
                    <h3 className="font-body text-lg font-bold text-[#1C1612] mb-3">{mod.title}</h3>
                    <p className="text-[#6B6155] text-sm leading-relaxed mb-4">{mod.problem}</p>
                    <div className="flex items-center gap-2 font-semibold pt-4 border-t border-[rgba(28,22,18,0.06)]" style={{ color: mod.accent }}>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{mod.outcome}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!preview && (
            <div data-reveal className="bg-white rounded-2xl border border-[rgba(42,107,90,0.12)] overflow-hidden shadow-premium">
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3D8B71, #3D8B7188)' }} />
              <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(61,139,113,0.12)' }}>
                    <ShoppingCart className="w-6 h-6" style={{ color: '#3D8B71' }} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.1em] text-[#6B6155] bg-[#F5F0EB] px-2.5 py-1 rounded-full inline-block mb-2">MODULE 06</span>
                    <h3 className="font-body text-lg font-bold text-[#1C1612]">Ecommerce Support</h3>
                    <p className="text-[#6B6155] text-sm">Auto-order processing, inventory alerts, and intelligent customer support.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-semibold flex-shrink-0 text-sm" style={{ color: '#3D8B71' }}>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Operate at 2x capacity without extra headcount
                </div>
              </div>
            </div>
          )}
        </div>

        {preview && (
          <div data-reveal className="text-center mt-16 md:mt-20">
            <Link href="/services" className="inline-flex items-center gap-2 text-base font-semibold text-[#2A6B5A] hover:text-[#1A4A3B] transition-colors duration-200 group">
              <span>Explore all six automation modules</span>
              <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
