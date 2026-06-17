'use client'

import { motion } from 'framer-motion'
import { AnimatedText } from '@/components/animated-text'
import { MessageSquare, Mail, Bot, CalendarCheck, FileText, Workflow } from 'lucide-react'
import Link from 'next/link'

const servicesList = [
  { icon: MessageSquare, title: 'WhatsApp Lead Automation', description: 'Instantly qualify and follow up with leads via WhatsApp. Never miss a sales opportunity again.', outcome: 'Never lose a lead to slow response time', color: '#25D366', lightBg: '#F0FFF4' },
  { icon: Mail, title: 'Email Workflow Automation', description: 'Smart email sequences that nurture prospects, onboard clients, and re-engage customers automatically.', outcome: 'Turn one-time buyers into repeat clients', color: '#2A6B5A', lightBg: '#E8F5F1' },
  { icon: Bot, title: 'AI Chatbot Systems', description: 'Intelligent chatbots that answer questions, collect data, and route hot leads to your team.', outcome: 'Your website works while you sleep', color: '#2A6B5A', lightBg: '#F0FAF7' },
  { icon: CalendarCheck, title: 'Appointment Booking Bots', description: 'Clients self-schedule 24/7. Syncs with your calendar and sends automatic reminders.', outcome: 'Cut no-shows by up to 40%', color: '#C8A96E', lightBg: '#F6FBF9' },
  { icon: FileText, title: 'Invoice & Data Automation', description: 'Automate invoice generation, payment tracking, and data entry. Cut admin time by 80%.', outcome: 'Reclaim 3+ hours every single day', color: '#2A6B5A', lightBg: '#E8F5F1' },
  { icon: Workflow, title: 'Custom Workflow Builds', description: 'Bespoke automation pipelines that fit exactly how your business operates.', outcome: 'Your exact process, fully automated', color: '#1A4A3B', lightBg: '#F0FAF7' },
]

export function Services({ preview = false, hideHeader = false }: { preview?: boolean; hideHeader?: boolean }) {
  const displayed = preview ? servicesList.slice(0, 3) : servicesList

  return (
    <section id="services" className="section-tinted py-16 md:py-20 px-5 md:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {!hideHeader && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="text-center mb-8 md:mb-10">
            <span className="label-overline mb-4 block">WHAT WE BUILD</span>
            <AnimatedText text="Six Systems. Zero Grunt Work." type="words" delay={0.1} className="text-[var(--text-h2)] text-[#1C1612] mb-6" />
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="text-[#6B6155] text-lg leading-relaxed max-w-xl mx-auto mt-4">
              Each system is custom-built for your business &mdash; deployed in 7 days, zero coding required on your end.
            </motion.p>

          </motion.div>
        )}

        <div className={preview ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'}>
          {displayed.map((service, idx) => {
            const Icon = service.icon
            const isFeatured = preview && idx === 0
            return (
              <div
                key={service.title}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
                className={`glass-card rounded-xl overflow-hidden group cursor-default flex flex-col ${isFeatured ? 'sm:col-span-2' : ''}`}
              >
                <div className="h-1 w-full" style={{ background: service.color }} />
                <div className={isFeatured ? 'p-6 sm:flex sm:gap-8 sm:items-start' : 'p-6'}>
                  <div className={`rounded-xl flex items-center justify-center mb-6 sm:mb-0 sm:flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isFeatured ? 'w-14 h-14' : 'w-12 h-12'}`} style={{ background: service.lightBg }}>
                    <Icon className={isFeatured ? 'w-8 h-8' : 'w-5 h-5'} style={{ color: service.color }} />
                  </div>
                  <div>
                    <h3 className={`font-body font-semibold text-[#1C1612] mb-2 ${isFeatured ? 'text-2xl' : 'text-xl'}`}>{service.title}</h3>
                    <p className="text-[#6B6155] text-sm leading-relaxed mb-3 flex-1">{service.description}</p>
                    <div className="pt-4 border-t border-[rgba(42,107,90,0.08)]">
                      <p className="text-xs font-semibold flex items-center gap-2" style={{ color: '#C8A96E' }}>
                        <span>✓</span>
                        {service.outcome}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {preview && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mt-12 md:mt-16">
            <Link href="/services" className="inline-flex items-center gap-2 text-[#2A6B5A] font-semibold hover:gap-3 transition-all duration-200">
              <span>View All Services</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
