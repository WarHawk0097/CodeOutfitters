'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { gsap } from '@/lib/animations/gsap-setup'
import { HeroWorkflowVisual } from '@/components/hero-workflow-visual'

export function Hero() {
  const [comfort, setComfort] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current, text = textRef.current
    if (!section || !text) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      const els = Array.from(text.querySelectorAll<HTMLElement>('[data-hero]'))

      if (comfort) {
        tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.08 })
        if (visualRef.current) tl.fromTo(visualRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.1')
      } else {
        tl.fromTo(els, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 })
        if (visualRef.current) {
          tl.fromTo(visualRef.current, { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'power2.out' }, '-=0.2')
        }
      }
    }, section)

    return () => ctx.revert()
  }, [comfort])

  return (
    <section ref={sectionRef} className="section-hero noise relative min-h-[90vh] lg:min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 40%, rgba(42,107,90,0.25) 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, rgba(250,250,247,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-[150px] opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)' }} aria-hidden="true" />

      <button
        onClick={() => setComfort(!comfort)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border border-[rgba(250,250,247,0.12)] text-[rgba(250,250,247,0.35)] hover:border-[rgba(250,250,247,0.3)] hover:text-[rgba(250,250,247,0.6)] transition-all duration-300"
        aria-label={`Motion: ${comfort ? 'Comfort' : 'Full'}`}
      >
        {comfort ? 'Comfort' : 'Full'} Motion
      </button>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24 w-full">
        <div className="lg:grid lg:grid-cols-7 lg:gap-10 items-center">
          <div ref={textRef} className="lg:col-span-2">
            <div
              data-hero
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] px-4 py-2 rounded-full mb-6"
              style={{ color: '#C8A96E', background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-pulse" />
              AI Automation Command Center
            </div>

            <h1 data-hero className="font-extrabold text-[#FAFAF7] mb-5 text-[clamp(1.85rem,4.5vw,3.25rem)] leading-[1.06] tracking-[-0.02em]">
              From manual chaos to<br className="hidden sm:block" />
              <span className="text-gradient">automated clarity</span>
            </h1>

            <p data-hero className="text-[#9B9088] text-base md:text-lg leading-relaxed mb-8 max-w-sm">
              We design and deploy custom AI automation systems for US small businesses. Deployed in 7 days. Zero coding on your end.
            </p>

            <div data-hero className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/contact" className="btn-primary flex items-center gap-2 min-h-[48px] px-7 py-3 text-base">
                <span>Claim Free Workflow Audit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/process"
                className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 rounded-lg text-base font-semibold text-[rgba(250,250,247,0.85)] border border-[rgba(250,250,247,0.2)] hover:border-[rgba(250,250,247,0.4)] transition-all duration-200"
              >
                See How It Works
              </Link>
            </div>

            <div data-hero className="flex flex-wrap items-center gap-5 text-xs text-[rgba(250,250,247,0.5)]">
              {['No long contracts', 'Results in 7 days', '30-day support'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#C8A96E] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div ref={visualRef} className="hidden lg:block lg:col-span-5 mt-12 lg:mt-0 min-h-[400px]">
            <HeroWorkflowVisual comfort={comfort} />
          </div>
        </div>
      </div>

      <div data-hero className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" aria-hidden="true">
        <span className="text-[10px] text-[rgba(250,250,247,0.3)] uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[rgba(250,250,247,0.3)] to-transparent" />
      </div>
    </section>
  )
}
