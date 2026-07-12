'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useNavScroll from '@/lib/animations/useNavScroll'
import { gsap } from '@/lib/animations/gsap-setup'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Industries', href: '/industries' },
  { label: 'Process', href: '/process' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { isHidden } = useNavScroll()
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!innerRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.out' } })
      tl.fromTo('.nav-logo', { opacity: 0, x: -6 }, { opacity: 1, x: 0 }, 0)
        .fromTo('.nav-link', { opacity: 0, y: -4 }, { opacity: 1, y: 0, stagger: 0.05 }, 0.15)
        .fromTo('.nav-cta', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1 }, 0.4)
    }, innerRef.current)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-[rgba(247,242,234,.92)] backdrop-blur-[14px] border-b border-[#E5DCCB] transition-transform duration-300 ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div ref={innerRef} className="max-w-[1180px] mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[68px] gap-3.5">
            <Link href="/" className="nav-logo flex items-center gap-2.5 flex-shrink-0" aria-label="CodeOutfitters home">
              <img src="/assets/logo-mark.svg" className="w-7 h-7" alt="" />
              <span className="font-heading text-[19px] tracking-tight text-[#0A120E]">
                Code<span className="text-[#17A063]">Outfitters</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-[clamp(14px,2vw,28px)]" aria-label="Main navigation">
              {navLinks.filter(l => l.label !== 'Home').map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`nav-link whitespace-nowrap font-body text-[15px] font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-[#0A120E]'
                        : 'text-[#4A5248] hover:text-[#0A120E]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:block flex-shrink-0">
              <Link
                href="/contact"
                className="nav-cta inline-flex items-center font-body font-semibold text-[14px] text-[#F7F2EA] bg-[#0E2A1D] rounded-[10px] px-[18px] py-[11px] whitespace-nowrap transition-all duration-150 hover:bg-[#17A063] hover:-translate-y-0.5"
              >
                Book a Call
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-[#0A120E]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-40 bg-[#F7F2EA] flex flex-col pt-16 px-5 sm:px-8 md:hidden"
          >
            <nav className="flex flex-col mt-8" aria-label="Mobile navigation">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      className={`text-xl font-heading transition-colors py-4 px-6 min-h-[52px] flex items-center ${
                        isActive ? 'text-[#17A063]' : 'text-[#0A120E] hover:text-[#17A063]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
