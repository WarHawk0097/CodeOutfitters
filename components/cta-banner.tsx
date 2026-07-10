'use client'

import { ArrowRight, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function CTABanner() {
  const sectionRef = useScrollReveal<HTMLDivElement>(0.12)

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-5 md:px-8 relative overflow-hidden" aria-label="Call to action">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1A3D30 0%, #1C3D32 50%, #2A6B5A 100%)' }} aria-hidden="true" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '18px 18px' }} aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)' }} aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <div data-reveal className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] px-5 py-2 rounded-full mb-8"
          style={{ color: '#C8A96E', background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)' }}>
          <ClipboardCheck className="w-4 h-4" />
          FREE WORKFLOW AUDIT
        </div>

        <h2 data-reveal className="text-[clamp(2rem,4.5vw,3.5rem)] text-[#FAFAF7] font-extrabold mb-5 max-w-3xl mx-auto leading-tight text-shadow-glow">
          See exactly what automation <br className="hidden sm:block" />
          can do for <span className="text-gradient">your business</span>
        </h2>

        <div data-reveal className="flex flex-wrap items-center justify-center gap-3 text-sm mb-10 text-[rgba(250,250,247,0.55)]">
          {['No commitment', '30-minute diagnostic', 'Custom roadmap', 'Zero pressure'].map((item) => (
            <span key={item} className="flex items-center gap-1.5 px-4 py-2 rounded-full" style={{ background: 'rgba(250,250,247,0.06)' }}>
              <svg className="w-3.5 h-3.5 text-[#C8A96E]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {item}
            </span>
          ))}
        </div>

        <div data-reveal className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 font-bold px-10 py-5 rounded-xl text-base transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
            style={{ background: '#C8A96E', color: '#1C1612', boxShadow: '0 4px 20px rgba(200,169,110,0.35)' }}
          >
            Book Your Free Audit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/process"
            className="inline-flex items-center gap-2 px-8 py-5 rounded-xl text-base font-semibold text-[rgba(250,250,247,0.85)] border-2 border-[rgba(250,250,247,0.2)] hover:text-white hover:border-[rgba(250,250,247,0.4)] transition-all duration-200"
          >
            See Our Process
          </Link>
        </div>
      </div>
    </section>
  )
}
