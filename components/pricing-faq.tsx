'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: "Do you charge hourly or per project?",
    answer: "Per project. We scope everything upfront so you know exactly what you're getting before we start.",
  },
  {
    question: "What if I don't know what I need?",
    answer: "That's what the discovery call is for. We'll map your workflow and tell you exactly what's automatable.",
  },
  {
    question: "Is there a minimum project size?",
    answer: "Yes — we focus on projects where automation saves you at least 5 hours/week. Smaller fixes aren't our sweet spot.",
  },
  {
    question: "Do you offer payment plans?",
    answer: "Yes. We typically split larger projects 50% upfront, 50% on delivery.",
  },
]

export function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-[var(--space-section)] bg-[#F5F0EB] relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-8"
        >
          <span className="label-overline mb-3 block">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1C1612] text-balance mb-6">
            Pricing Questions
          </h2>
        </motion.div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
                className="glass-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-base font-semibold text-[#1C1612] leading-snug">
                    {faq.question}
                  </span>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F5F1] flex items-center justify-center">
                    {isOpen
                      ? <Minus className="w-3.5 h-3.5 text-[#2A6B5A]" />
                      : <Plus className="w-3.5 h-3.5 text-[#2A6B5A]" />
                    }
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-[#6B6155] leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
