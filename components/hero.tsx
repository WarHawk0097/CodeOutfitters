'use client'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="section-hero noise relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(42,107,90,0.18) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(250,250,247,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 w-full">
        <div
          data-aos="fade-up"
          data-aos-delay="0"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] px-4 py-2 rounded-full mb-6"
          style={{ color: '#C8A96E', background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.25)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-pulse" />
          AI Automation Agency
        </div>

        <h1
          data-aos="fade-up"
          data-aos-delay="100"
          className="font-extrabold text-[#FAFAF7] mb-5"
        >
          We automate the work<br className="hidden sm:block" />
          you shouldn&apos;t be doing
        </h1>

        <p
          data-aos="fade-up"
          data-aos-delay="200"
          className="text-[#9B9088] text-lg leading-relaxed mb-8 max-w-xl"
        >
          AI-powered automations for US small businesses —
          built in 7 days, zero coding required on your end.
        </p>

        <div
          data-aos="fade-up"
          data-aos-delay="300"
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <Link href="/pricing" className="btn-primary flex items-center gap-2 min-h-[44px]">
            <span>Get a Custom Quote</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/book"
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-lg text-sm font-semibold text-[rgba(250,250,247,0.85)] border border-[rgba(250,250,247,0.2)] hover:border-[rgba(250,250,247,0.4)] transition-all duration-200"
          >
            Book a Free Call
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-[rgba(250,250,247,0.5)]">
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        aria-hidden="true"
      >
        <span className="text-[10px] text-[rgba(250,250,247,0.3)] uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[rgba(250,250,247,0.3)] to-transparent" />
      </motion.div>
    </section>
  )
}
