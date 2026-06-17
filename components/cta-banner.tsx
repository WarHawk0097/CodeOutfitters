'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTABanner() {
  return (
    <section className="py-16 md:py-20 px-5 md:px-8 relative overflow-hidden" aria-label="Call to action">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #1C1612 0%, #1C3D32 100%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <span data-aos="fade-up" data-aos-delay="0" className="label-overline mb-3 block">Let&apos;s Talk</span>
        <h2 data-aos="fade-up" data-aos-delay="0" className="text-3xl md:text-4xl font-bold text-[#FAFAF7] text-balance mb-6">
          Book a Discovery Call
        </h2>
        <p data-aos="fade-up" data-aos-delay="100" className="text-[rgba(250,250,247,0.7)] text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          30 minutes. No sales pressure. We map your biggest time drains and show you
          exactly what automation looks like for your business — free.
        </p>
        <Link
          data-aos="fade-up"
          data-aos-delay="200"
          href="/contact"
          className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-sm"
          style={{ background: '#C8A96E', color: '#1C1612' }}
        >
          Book Free Discovery Call
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
