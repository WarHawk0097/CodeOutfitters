'use client'

import { motion } from 'framer-motion'
import { Target, Users, ShieldCheck, Zap } from 'lucide-react'

const values = [
  {
    icon: Target,
    title: 'Results-First',
    description: 'Every system we build is measured by ROI — hours saved, leads captured, errors eliminated. We don\'t ship until the numbers make sense.',
  },
  {
    icon: Users,
    title: 'Small Business Focus',
    description: 'We work exclusively with US small businesses. We understand your constraints, your margins, and your need for speed over perfection.',
  },
  {
    icon: ShieldCheck,
    title: 'You Own Everything',
    description: 'No proprietary platforms, no vendor lock-in. Every workflow, every credential, every system belongs to you — always.',
  },
  {
    icon: Zap,
    title: 'Speed Without Shortcuts',
    description: '7-day delivery is our promise, not a marketing line. We\'ve built a process that moves fast without cutting corners on reliability.',
  },
]

export function AboutValues() {
  return (
    <section className="py-16 md:py-20 bg-[#F5F0EB] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-6"
        >
          <p className="section-label mb-4">Our Values</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#1C1612] text-balance max-w-xl mx-auto">
            Why Clients Choose CodeOutfitters
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {values.map((value, i) => {
            const Icon = value.icon
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
                className="glass-card card-interactive rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F5F1] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#2A6B5A]" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#1C1612] mb-2 tracking-tight">{value.title}</h3>
                <p className="text-[#6B6155] text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
