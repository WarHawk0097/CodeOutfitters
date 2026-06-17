'use client'

import { Zap, Linkedin, Mail } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1C1612] text-white">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2A6B5A] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                Code<span className="text-[#C8A96E]">Outfitters</span>
              </span>
            </div>
            <p className="text-[rgba(255,255,255,0.6)] text-sm leading-relaxed max-w-xs mb-6">
              AI automation for US small businesses. We eliminate repetitive work so you can focus on what actually grows your business.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#2A6B5A] flex items-center justify-center transition-colors duration-200" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4 text-white" />
              </a>
              <a href="mailto:hello@codeoutfitters.com" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#2A6B5A] flex items-center justify-center transition-colors duration-200" aria-label="Email">
                <Mail className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-4">Services</p>
            <ul className="space-y-3">
              {['WhatsApp Automation', 'Email Workflows', 'AI Chatbots', 'Booking Bots', 'Invoice Automation', 'Custom Builds'].map((s) => (
                <li key={s}><Link href="/services" className="text-sm text-[rgba(255,255,255,0.6)] hover:text-[#C8A96E] transition-colors duration-200">{s}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.4)] mb-4">Company</p>
            <ul className="space-y-3">
              {[{ label: 'About', href: '/about' }, { label: 'Portfolio', href: '/portfolio' }, { label: 'Get a Quote', href: '/pricing' }, { label: 'Contact', href: '/contact' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }].map((link) => (
                <li key={link.label}><Link href={link.href} className="text-sm text-[rgba(255,255,255,0.6)] hover:text-[#C8A96E] transition-colors duration-200">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[rgba(255,255,255,0.4)] text-xs">&copy; {year} CodeOutfitters LLC. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
