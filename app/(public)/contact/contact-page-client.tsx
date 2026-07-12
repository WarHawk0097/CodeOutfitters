'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Mail, MessageCircle, FileText, CheckCircle, Clock, Send } from 'lucide-react'
import Link from 'next/link'

const interestOptions = [
  'WhatsApp Automation',
  'Email Automation',
  'Support / Helpdesk',
  'Booking / Scheduling',
  'Invoice / Billing',
  'Custom Workflow',
  'Not sure yet',
]

const steps = [
  { num: 1, text: 'We reply within 1 business day to schedule your call' },
  { num: 2, text: '30-minute discovery call to map your workflow' },
  { num: 3, text: 'You receive a fixed quote — no pressure, no pitch' },
]

const featureChips = ['Response within 1 day', 'Free workflow audit', 'No obligation', 'You own everything']

function ContactHeroAndForm() {
  const [form, setForm] = useState({ name: '', email: '', business: '', interest: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.business.trim()) e.business = 'Required'
    if (!form.interest) e.interest = 'Please select'
    if (!form.message.trim()) e.message = 'Required'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const inputClass = (error: boolean) =>
    `w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all duration-200 ${
      error
        ? 'border border-red-400'
        : 'border border-transparent'
    }`
    .trim()

  const inputBg = { background: 'rgba(10,18,14,.03)' }
  const focusStyle = 'focus:border-[#17A063] focus:ring-2 focus:ring-[rgba(23,160,99,.12)] focus:bg-white'

  return (
    <section className="relative overflow-hidden" style={{ background: '#F7F2EA' }}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left column — intro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-6"
              style={{
                color: '#D9B36A',
                background: 'rgba(217,179,106,.1)',
                border: '1px solid rgba(217,179,106,.2)',
              }}
            >
              Let&apos;s talk
            </span>

            <h1
              className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] -tracking-[.02em] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
            >
              Tell us what&apos;s eating your team&apos;s time.
            </h1>

            <p className="text-base leading-relaxed mb-8" style={{ color: '#5B6355' }}>
              No pressure, no sales pitch. We&apos;ll listen to your workflow, identify where automation
              makes sense, and give you a fixed quote — all before you commit to anything.
            </p>

            <div className="space-y-4 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8A857B' }}>
                What happens next
              </p>
              {steps.map((s) => (
                <div key={s.num} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                    style={{
                      background: 'rgba(23,160,99,.1)',
                      color: '#17A063',
                    }}
                  >
                    {s.num}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#5B6355' }}>{s.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {featureChips.map((chip) => (
                <span
                  key={chip}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(23,160,99,.06)',
                    color: '#128A54',
                    border: '1px solid rgba(23,160,99,.14)',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right column — form card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-[22px] p-10 md:p-12 flex flex-col items-center text-center"
                  style={{
                    background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                    border: '1px solid rgba(13,58,49,.14)',
                    boxShadow: '0 4px 30px rgba(0,0,0,.06)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                    style={{ background: 'rgba(23,160,99,.1)' }}
                  >
                    <CheckCircle className="w-8 h-8" style={{ color: '#17A063' }} />
                  </motion.div>
                  <h2
                    className="text-2xl font-semibold mb-3"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
                  >
                    Message sent!
                  </h2>
                  <p className="text-sm leading-relaxed mb-8 max-w-sm" style={{ color: '#5B6355' }}>
                    Thanks for reaching out. We&apos;ll get back to you within 1 business day to schedule your
                    free discovery call.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', business: '', interest: '', message: '' }) }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: 'rgba(10,18,14,.05)',
                      color: '#0A120E',
                      border: '1px solid rgba(13,58,49,.14)',
                    }}
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-[22px] p-7 md:p-8 space-y-5"
                  style={{
                    background: 'linear-gradient(180deg,#fff,#FBF7EE 68%,#F6F1E4)',
                    border: '1px solid rgba(13,58,49,.14)',
                    boxShadow: '0 4px 30px rgba(0,0,0,.06)',
                  }}
                  noValidate
                >
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#5B6355' }}>
                      Full name <span style={{ color: '#17A063' }}>*</span>
                    </label>
                    <input
                      id="name" name="name" type="text" value={form.name} onChange={handleChange}
                      placeholder="Jane Smith" maxLength={100}
                      className={`${inputClass(!!errors.name)} ${focusStyle}`}
                      style={inputBg}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#5B6355' }}>
                      Work email <span style={{ color: '#17A063' }}>*</span>
                    </label>
                    <input
                      id="email" name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="jane@company.com" maxLength={100}
                      className={`${inputClass(!!errors.email)} ${focusStyle}`}
                      style={inputBg}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="business" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#5B6355' }}>
                      Business name <span style={{ color: '#17A063' }}>*</span>
                    </label>
                    <input
                      id="business" name="business" type="text" value={form.business} onChange={handleChange}
                      placeholder="Acme Inc." maxLength={100}
                      className={`${inputClass(!!errors.business)} ${focusStyle}`}
                      style={inputBg}
                    />
                    {errors.business && <p className="text-red-500 text-xs mt-1">{errors.business}</p>}
                  </div>

                  <div>
                    <label htmlFor="interest" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#5B6355' }}>
                      What are you interested in? <span style={{ color: '#17A063' }}>*</span>
                    </label>
                    <select
                      id="interest" name="interest" value={form.interest} onChange={handleChange}
                      className={`${inputClass(!!errors.interest)} ${focusStyle} appearance-none`}
                      style={{ ...inputBg, color: form.interest ? '#0A120E' : '#8A857B' }}
                    >
                      <option value="" disabled>Select an option</option>
                      {interestOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.interest && <p className="text-red-500 text-xs mt-1">{errors.interest}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#5B6355' }}>
                      Tell us about your workflow <span style={{ color: '#17A063' }}>*</span>
                    </label>
                    <textarea
                      id="message" name="message" value={form.message} onChange={handleChange}
                      rows={4} placeholder="What repetitive task is eating the most time? What does your current process look like?"
                      maxLength={2000}
                      className={`${inputClass(!!errors.message)} ${focusStyle} resize-none`}
                      style={inputBg}
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:gap-3"
                    style={{
                      background: 'linear-gradient(160deg,#E7C57E,#D9B36A)',
                      color: '#0A120E',
                      boxShadow: '0 12px 32px rgba(217,179,106,.25), inset 0 1px 0 rgba(255,255,255,.4)',
                    }}
                  >
                    Book Free Discovery Call
                    <Send className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-center" style={{ color: '#8A857B' }}>
                    No spam, ever. We&apos;ll never share your information.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function OtherWaysToReach() {
  const [copied, setCopied] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@codeoutfitters.ai')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      className="py-20 md:py-28 px-5 md:px-8 relative overflow-hidden"
      style={{ background: '#0E241A' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(540px 340px at 50% 50%, rgba(23,160,99,.06), transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span
            className="inline-block text-[11px] font-semibold uppercase tracking-[.18em] px-4 py-2 rounded-full mb-4"
            style={{
              color: '#D9B36A',
              background: 'rgba(217,179,106,.1)',
              border: '1px solid rgba(217,179,106,.2)',
            }}
          >
            Other ways to reach us
          </span>
          <h2
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] -tracking-[.02em]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
          >
            Not ready for a call yet?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0 }}
            className="rounded-[22px] p-7 flex flex-col gap-4"
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(43,212,131,.1)' }}
            >
              <Mail className="w-5 h-5" style={{ color: '#2BD483' }} />
            </div>
            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                Email us
              </h3>
              <p className="text-sm mb-3" style={{ color: 'rgba(245,240,232,.55)' }}>
                Prefer writing? Send us a message and we&apos;ll respond within 1 business day.
              </p>
              <button
                onClick={copyEmail}
                className="text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2"
                style={{ color: '#2BD483' }}
              >
                {copied ? 'Copied!' : 'hello@codeoutfitters.ai'}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="rounded-[22px] p-7 flex flex-col gap-4"
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(43,212,131,.1)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: '#2BD483' }} />
            </div>
            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                WhatsApp
              </h3>
              <p className="text-sm mb-3" style={{ color: 'rgba(245,240,232,.55)' }}>
                Chat with our bot to get a quick sense of what we do and whether it fits your business.
              </p>
              <span className="text-sm font-semibold" style={{ color: 'rgba(245,240,232,.35)' }}>
                Coming soon
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="rounded-[22px] p-7 flex flex-col gap-4"
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(43,212,131,.1)' }}
            >
              <FileText className="w-5 h-5" style={{ color: '#2BD483' }} />
            </div>
            <div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F5F0E8' }}
              >
                See our process
              </h3>
              <p className="text-sm mb-3" style={{ color: 'rgba(245,240,232,.55)' }}>
                Want to understand how we work before reaching out? Read through our full process.
              </p>
              <Link
                href="/process"
                className="text-sm font-semibold inline-flex items-center gap-1.5 transition-all duration-200 hover:gap-2"
                style={{ color: '#2BD483' }}
              >
                View process <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MiniFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    { q: 'How fast will you respond?', a: 'We reply within 1 business day — usually faster. Every inquiry gets a real human reply, not an automated sequence.' },
    { q: 'How ready do I need to be?', a: 'Not ready at all. Most clients start with "this takes too much time." We help identify the highest-ROI workflow to automate first.' },
    { q: 'Do you work with international clients?', a: 'We primarily serve US-based businesses, but if your workflow is compatible with US business hours and tools, we can discuss it on the discovery call.' },
  ]

  return (
    <section className="py-16 md:py-20 px-5 md:px-8 relative" style={{ background: '#F7F2EA' }}>
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold leading-[1.15] text-center mb-10"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0A120E' }}
        >
          Quick answers
        </motion.h2>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-colors duration-300"
              style={{
                background: openIndex === i ? '#fff' : 'rgba(255,255,255,.5)',
                border: '1px solid rgba(13,58,49,.08)',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-medium" style={{ color: '#0A120E' }}>{faq.q}</span>
                <ArrowRight
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-out ${openIndex === i ? 'rotate-90' : ''}`}
                  style={{ color: '#17A063' }}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: openIndex === i ? 200 : 0,
                  opacity: openIndex === i ? 1 : 0,
                }}
              >
                <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#5B6355' }}>
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactPageClient() {
  return (
    <>
      <ContactHeroAndForm />
      <OtherWaysToReach />
      <MiniFAQ />
    </>
  )
}
