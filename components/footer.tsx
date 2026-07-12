'use client'

import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function Footer() {
  const year = new Date().getFullYear()
  const sectionRef = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <footer className="bg-[#070D0A] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} aria-hidden="true" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #17A063 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #D9B36A 0%, transparent 70%)' }} aria-hidden="true" />

      <div ref={sectionRef} className="relative max-w-[1180px] mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-8">
          <div data-reveal className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/assets/logo-mark.svg" className="w-7 h-7" alt="" />
              <span className="font-heading text-lg text-white">
                Code<span className="text-[#D9B36A]">Outfitters</span>
              </span>
            </div>
            <p className="text-[rgba(255,255,255,0.45)] text-sm leading-relaxed max-w-sm mb-6">
              AI automation command center for US small businesses. We design, deploy, and maintain custom automation systems so you can focus on growth.
            </p>
          </div>

          <div data-reveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.35)] mb-5">Navigate</p>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: '/' },
                { label: 'Services', href: '/services' },
                { label: 'Industries', href: '/industries' },
                { label: 'Process', href: '/process' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[rgba(255,255,255,0.45)] hover:text-[#D9B36A] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.35)] mb-5">Company</p>
            <ul className="space-y-3">
              {[
                { label: 'Security & Reliability', href: '/security' },
                { label: 'Case Studies', href: '/case-studies' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[rgba(255,255,255,0.45)] hover:text-[#D9B36A] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div data-reveal className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[rgba(255,255,255,0.35)] text-xs">&copy; {year} CodeOutfitters LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
