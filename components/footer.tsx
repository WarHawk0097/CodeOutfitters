'use client'

import { Zap, Linkedin, Mail } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'

export function Footer() {
  const year = new Date().getFullYear()
  const sectionRef = useScrollReveal<HTMLDivElement>(0.08)

  return (
    <footer className="bg-[#1C1612] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} aria-hidden="true" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #2A6B5A 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] opacity-8 pointer-events-none" style={{ background: 'radial-gradient(circle, #C8A96E 0%, transparent 70%)' }} aria-hidden="true" />

      <div ref={sectionRef} className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-8">
          <div data-reveal className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#2A6B5A] flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                Code<span className="text-[#C8A96E]">Outfitters</span>
              </span>
            </div>
            <p className="text-[rgba(255,255,255,0.45)] text-sm leading-relaxed max-w-sm mb-6">
              AI automation command center for US small businesses. We design, deploy, and maintain custom automation systems so you can focus on growth.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-[#2A6B5A] flex items-center justify-center transition-all duration-200" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4 text-white" />
              </a>
              <a href="mailto:hello@codeoutfitters.com" className="w-10 h-10 rounded-lg bg-white/10 hover:bg-[#2A6B5A] flex items-center justify-center transition-all duration-200" aria-label="Email">
                <Mail className="w-4 h-4 text-white" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(200,169,110,0.15)', color: '#C8A96E' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] animate-pulse" />
                Book Free Audit
              </Link>
            </div>
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
                  <Link href={link.href} className="text-sm text-[rgba(255,255,255,0.45)] hover:text-[#C8A96E] transition-colors duration-200">
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
                  <Link href={link.href} className="text-sm text-[rgba(255,255,255,0.45)] hover:text-[#C8A96E] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div data-reveal className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[rgba(255,255,255,0.35)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A6B5A] animate-pulse" />
            All systems operational
          </div>
          <p className="text-[rgba(255,255,255,0.35)] text-xs">&copy; {year} CodeOutfitters LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
