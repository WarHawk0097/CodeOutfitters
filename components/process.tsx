'use client'

import { motion } from 'framer-motion'
import { Phone, Wrench, Rocket, HeadphonesIcon } from 'lucide-react'

const steps = [
  { icon: Phone, title: 'Discovery Call', description: '30 minutes — we map your exact workflow, find your biggest time drains, and tell you honestly whether automation is the right fit.' },
  { icon: Wrench, title: 'Custom Scope', description: 'We design the automation architecture specific to your tools and business, then send you a clear scope with timeline and cost before we start.' },
  { icon: Rocket, title: 'We Build It', description: '7–30 days depending on scope. We handle every technical detail — you just review and approve before anything goes live.' },
  { icon: HeadphonesIcon, title: 'You Save Time', description: 'Ongoing support included. We monitor your automations, fix issues fast, and optimize as your business grows.' },
]

export function Process() {
  return (
    <section id="process" className="section-light py-16 md:py-20 px-5 md:px-8 relative overflow-hidden">
      <div className="relative max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="text-center mb-8 md:mb-10">
          <span className="label-overline mb-4 block">HOW IT WORKS</span>
          <h2 className="text-3xl md:text-4xl text-[#1C1612] mb-6 max-w-2xl mx-auto">From Discovery to Deployed in 7 Days</h2>
          <p className="text-[#6B6155] text-lg leading-relaxed max-w-xl mx-auto mt-4">A streamlined process designed to minimize your time investment while maximizing results.</p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-16 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, #2A6B5A, #C8A96E, transparent)' }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.title} data-aos="fade-up" data-aos-delay={i * 150} className="relative text-center">
                  <div className="relative mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-6 z-10" style={{ background: 'linear-gradient(135deg, #2A6B5A, #2A6B5A)', boxShadow: '0 8px 24px rgba(42,107,90,0.3)' }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-body text-xl font-semibold text-[#1C1612] mb-3">{step.title}</h4>
                  <p className="text-[#6B6155] text-sm leading-relaxed">{step.description}</p>
                  {i < 3 && <div className="hidden lg:block absolute -right-3 top-16 text-[#2A6B5A] z-20 text-2xl font-light">&rarr;</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
