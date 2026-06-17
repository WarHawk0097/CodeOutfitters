'use client'

import { motion } from 'framer-motion'
import { AnimatedText } from '@/components/animated-text'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface PageHeroProps {
  label: string
  title: string
  description: string
  breadcrumb: string
}

export function PageHero({ label, title, description, breadcrumb }: PageHeroProps) {
  return (
    <section
      className="relative py-16 md:py-20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FAFAF7 0%, #F5F0EB 50%, #E8F5F1 100%)' }}
      aria-label={`${breadcrumb} page header`}
    >
      <div className="absolute inset-0 dot-grid opacity-50" aria-hidden="true" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(42,107,90,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-8 lg:px-6">
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-1.5 text-sm text-[#6B6155] mb-6"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-[#2A6B5A] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-[#1C1612] font-medium">{breadcrumb}</span>
        </motion.nav>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl"
        >
          <p className="section-label mb-4">{label}</p>
          <AnimatedText
            text={title}
            type="words"
            delay={0.1}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1C1612]"
          />
          <p className="text-base sm:text-lg text-[#6B6155] leading-relaxed max-w-2xl">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
