'use client'
import { motion } from 'framer-motion'

const stats = [
  { value: '< 7 Days', label: 'Average Setup Time' },
  { value: '24/7', label: 'Systems Uptime' },
  { value: '100%', label: 'You Own Everything' },
]

export function TrustBar() {
  return (
    <div className="border-y border-[rgba(42,107,90,0.12)] bg-white py-5">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="text-center"
            >
              <div className="font-heading text-xl font-bold text-[#2A6B5A]">
                {stat.value}
              </div>
              <div className="text-xs text-[#6B6155] font-medium mt-0.5">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
