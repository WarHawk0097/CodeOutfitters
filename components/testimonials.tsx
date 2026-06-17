'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import useScrollReveal from '@/lib/animations/useScrollReveal'

const testimonials = [
  {
    name: 'Marcus T.',
    role: 'Owner, Sunrise Realty',
    location: 'Austin, TX',
    text: 'We were losing leads every weekend when the office was closed. CodeOutfitters built a WhatsApp bot that now qualifies and responds to every inquiry instantly. We closed 3 deals last month that we would have lost before.',
    stars: 5,
    result: 'Leads no longer slip through overnight',
  },
  {
    name: 'Jennifer K.',
    role: 'Operations Manager, FreshBite Co.',
    location: 'Chicago, IL',
    text: 'Invoice processing was killing us — 4 hours a day just entering data. The automation they built handles 200+ orders daily with zero errors. My team finally focuses on actual work.',
    stars: 5,
    result: 'Admin work no longer dominates the day',
  },
  {
    name: 'Dr. Samuel R.',
    role: 'Practice Director, ClearView Clinic',
    location: 'Miami, FL',
    text: 'The appointment bot cut our phone calls by 90%. Patients love booking 24/7. No-shows dropped 40% because of the automated reminders. Setup was done in 5 days exactly as promised.',
    stars: 5,
    result: 'Clients book without calling the office',
  },
]

export function Testimonials() {
  const [current, setCurrent] = useState(0)
  const sectionRef = useScrollReveal<HTMLElement>({ direction: 'up', delay: 0.2 })

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-5 md:px-8 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="section-label mb-4 block">CLIENT RESULTS</span>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1C1612] mb-6">
            The kind of results our clients see
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white border border-[rgba(42,107,90,0.10)] rounded-xl p-6 lg:p-8 max-w-3xl mx-auto transition-all duration-200 ease-out"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[current].stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                ))}
              </div>
              <blockquote className="text-[#1C1612] text-lg leading-relaxed font-medium mb-8">
                &ldquo;{testimonials[current].text}&rdquo;
              </blockquote>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1C1612]">
                    {testimonials[current].name}
                  </p>
                  <p className="text-sm text-[#6B6155]">
                    {testimonials[current].role} &middot; {testimonials[current].location}
                  </p>
                </div>
                <div className="bg-[#E8F5F1] rounded-full px-4 py-2 text-sm font-semibold text-[#2A6B5A]">
                  {testimonials[current].result}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-[rgba(42,107,90,0.2)] flex items-center justify-center text-[#2A6B5A] hover:bg-[#E8F5F1] focus-visible:outline-2 focus-visible:outline-[#2A6B5A] focus-visible:outline-offset-2 transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`rounded-full transition-all duration-300
                  ${i === current
                    ? 'w-6 h-2 bg-[#2A6B5A]'
                    : 'w-2 h-2 bg-[rgba(42,107,90,0.25)]'}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-[rgba(42,107,90,0.2)] flex items-center justify-center text-[#2A6B5A] hover:bg-[#E8F5F1] focus-visible:outline-2 focus-visible:outline-[#2A6B5A] focus-visible:outline-offset-2 transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
