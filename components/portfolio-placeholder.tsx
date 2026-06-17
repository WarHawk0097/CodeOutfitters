'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

export function PortfolioPlaceholder() {
  return (
    <section className="py-[var(--space-section)] bg-[#F5F0EB]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="glass-card rounded-xl p-10 text-center border-dashed border-2 border-[rgba(42,107,90,0.2)]"
        >
          <div className="w-12 h-12 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[#2A6B5A]" />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#1C1612] mb-2">More Case Studies Coming Soon</h3>
          <p className="text-[#6B6155] text-sm max-w-md mx-auto leading-relaxed">
            We&apos;re currently working on publishing additional case studies. Check back soon, or reach out to hear directly about results from our recent clients.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
