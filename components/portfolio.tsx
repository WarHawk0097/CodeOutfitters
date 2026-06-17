'use client'

import { TrendingUp, Home, ShoppingBag, HeartPulse } from 'lucide-react'
import Link from 'next/link'

export const cases = [
  {
    icon: Home,
    industry: 'Real Estate',
    tag: 'WhatsApp Automation',
    topBorderColor: '#2A6B5A',
    iconBg: '#E8F5F1',
    iconColor: '#2A6B5A',
    tagBg: '#E8F5F1',
    tagColor: '#2A6B5A',
    title: 'How a Real Estate Agency Doubled Lead Response Rate',
    description: 'A 3-agent real estate office was losing leads to faster competitors. We built a WhatsApp bot that qualifies, responds, and books viewings 24/7.',
    results: [
      { metric: '2x', label: 'Lead Response Rate' },
      { metric: '67%', label: 'Fewer Manual Follow-ups' },
      { metric: '18 hrs', label: 'Saved Per Week' },
    ],
  },
  {
    icon: ShoppingBag,
    industry: 'E-commerce',
    tag: 'Invoice Automation',
    topBorderColor: '#2A6B5A',
    iconBg: '#F0FAF7',
    iconColor: '#2A6B5A',
    tagBg: '#F0FAF7',
    tagColor: '#2A6B5A',
    title: 'Invoice Processing Reduced from 4 Hours to 8 Minutes Daily',
    description: 'An online retailer was manually creating invoices and reconciling orders. Our automation pipeline handles 200+ invoices per day, error-free.',
    results: [
      { metric: '97%', label: 'Time Saved on Invoicing' },
      { metric: '0', label: 'Data Entry Errors' },
      { metric: '$1,200', label: 'Admin Cost Saved/mo' },
    ],
  },
  {
    icon: HeartPulse,
    industry: 'Healthcare',
    tag: 'Booking Bot',
    topBorderColor: '#C8A96E',
    iconBg: '#F6FBF9',
    iconColor: '#C8A96E',
    tagBg: '#F6FBF9',
    tagColor: '#C8A96E',
    title: 'Medical Clinic Eliminates 90% of Phone-Based Scheduling',
    description: 'A busy clinic was overwhelmed by appointment calls. We deployed an AI booking bot that syncs with their calendar and sends reminders automatically.',
    results: [
      { metric: '90%', label: 'Fewer Scheduling Calls' },
      { metric: '40%', label: 'Drop in No-Shows' },
      { metric: '24/7', label: 'Booking Availability' },
    ],
  },
]

export function Portfolio({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section id="portfolio" className="py-16 md:py-20 px-5 md:px-8 bg-[#F5F0EB] relative overflow-hidden">
      <div className="relative max-w-4xl mx-auto">
        {!hideHeader && (
          <div className="text-center mb-8 md:mb-10">
            <span className="label-overline mb-4 block">SAMPLE WORK</span>
            <h2 className="text-[#1C1612] mb-6 max-w-2xl mx-auto">
              Real Businesses, Real Results
            </h2>
            <p className="text-[#6B6155] text-lg leading-relaxed max-w-xl mx-auto mt-4">
              Every automation we build is measured by one metric: time and money saved for our clients.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cases.map((c, i) => {
            const Icon = c.icon
            return (
              <div
                key={c.title}
                data-aos="zoom-in"
                data-aos-delay={i * 100}
                className="flex flex-col bg-white border border-[rgba(28,22,18,0.08)] rounded-xl overflow-hidden"
                style={{ borderTop: `3px solid ${c.topBorderColor}` }}
              >
                {/* Icon area — fixed height */}
                <div className="h-48 bg-[#F5F0EB] flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <Icon className="w-8 h-8" style={{ color: c.iconColor }} />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(42,107,90,0.08)] text-[#2A6B5A] border border-[rgba(42,107,90,0.2)] uppercase tracking-wide">
                      Sample Project
                    </span>
                  </div>
                </div>

                {/* Content area — grows naturally */}
                <div className="p-6 flex flex-col">
                  <div className="flex gap-2 flex-wrap mb-4">
                    <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-white border border-[rgba(42,107,90,0.12)] text-[#6B6155] uppercase tracking-wide">
                      {c.industry}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide border"
                      style={{ background: c.tagBg, color: c.tagColor, borderColor: `${c.topBorderColor}25` }}
                    >
                      {c.tag}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[#1C1612] mb-2 leading-tight">
                    {c.title}
                  </h3>

                  <p className="text-sm text-[#6B6155] leading-relaxed mb-4 flex-1">
                    {c.description}
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[rgba(28,22,18,0.06)] mb-4">
                    {c.results.map((r) => (
                      <div key={r.label} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <TrendingUp className="w-3 h-3 text-[#2A6B5A]" />
                          <span className="text-sm font-bold text-[#2A6B5A]">{r.metric}</span>
                        </div>
                        <span className="text-[10px] text-[#6B6155] leading-tight block">{r.label}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/pricing"
                    className="text-[#2A6B5A] text-sm font-semibold hover:underline"
                  >
                    Get a Similar System &rarr;
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
