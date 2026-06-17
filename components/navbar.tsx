'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useNavScroll from '@/lib/animations/useNavScroll'

const navLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Get a Quote', href: '/pricing' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { isHidden } = useNavScroll()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className={`sticky top-0 z-40 bg-[rgba(250,250,247,0.92)] backdrop-blur-md border-b border-[rgba(28,22,18,0.06)] transition-transform duration-300 ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0" aria-label="CodeOutfitters home">
              <div className="w-9 h-9 rounded-lg bg-[#2A6B5A] flex items-center justify-center group-hover:shadow-[0_4px_12px_rgba(42,107,90,0.35)] transition-all duration-300">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-[#1C1612]">
                Code<span className="text-[#2A6B5A]">Outfitters</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`whitespace-nowrap text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-[#2A6B5A]'
                        : 'text-[#6B6155] hover:text-[#1C1612]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            <div className="hidden md:block flex-shrink-0">
              <Link href="/contact" className="btn-primary">
                Get Free Audit
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-[#1C1612]"
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
            className="fixed inset-0 z-40 bg-[#FAFAF7] flex flex-col pt-16 px-5 sm:px-8 md:hidden"
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
                      className={`text-xl font-heading font-bold transition-colors py-4 px-6 min-h-[52px] flex items-center ${
                        isActive ? 'text-[#2A6B5A]' : 'text-[#1C1612] hover:text-[#2A6B5A]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="px-6 mt-4"
              >
                <Link
                  href="/contact"
                  className="btn-primary w-full text-center block py-3"
                >
                  Get Free Audit
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
