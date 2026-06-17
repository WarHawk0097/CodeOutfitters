'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const businessTypes = [
  'Real Estate',
  'Healthcare',
  'Legal',
  'E-commerce',
  'Restaurant',
  'Service Business',
  'Other',
]

const timelines = [
  'ASAP',
  'Within 1 month',
  '1-3 months',
  'Just exploring',
]

interface FormData {
  fullName: string
  email: string
  company: string
  businessType: string
  automationGoal: string
  currentTools: string
  timeline: string
  honeypot: string
}

export function QuoteForm() {
  const inputClass = (error: boolean) =>
    `w-full bg-[#FAFAF7] border rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#1C1612] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 focus:bg-white ${
      error ? 'border-red-400' : 'border-transparent'
    }`

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    company: '',
    businessType: '',
    automationGoal: '',
    currentTools: '',
    timeline: '',
    honeypot: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.company.trim()) e.company = 'Required'
    if (!form.businessType) e.businessType = 'Please select'
    if (!form.automationGoal.trim()) e.automationGoal = 'Required'
    if (!form.currentTools.trim()) e.currentTools = 'Required'
    if (!form.timeline) e.timeline = 'Please select'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.honeypot) return

    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitError('')
    setLoading(true)
    try {
      if (!process.env.NEXT_PUBLIC_FORMS_WORKER_URL) {
        setSubmitError('Quote request temporarily unavailable. Email us directly at hello@codeoutfitters.com')
        setLoading(false)
        return
      }
      // Security 4 (2026-06-16): the browser no longer holds the n8n
      // webhook URL or any n8n secret. The form posts to a Cloudflare
      // Worker which adds the per-form secret header server-side and
      // forwards to the correct n8n webhook URL. The Worker is the
      // source of truth for the per-form routing and secret header.
      const workerUrl = process.env.NEXT_PUBLIC_FORMS_WORKER_URL.replace(/\/+$/, '') + '/'
      const payload = {
        source: 'quote_request',
        fullName: form.fullName,
        email: form.email,
        company: form.company,
        businessType: form.businessType,
        automationGoal: form.automationGoal,
        currentTools: form.currentTools,
        timeline: form.timeline,
      }
      const res = await fetch(workerUrl, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong. Email us at hello@codeoutfitters.com')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  if (submitted) {
    return (
      <section className="py-12 lg:py-16 bg-[#F5F0EB] relative overflow-hidden" id="quote-form">
        <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
        <div className="relative max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="glass-card rounded-2xl p-12">
            <div className="w-16 h-16 rounded-full bg-[#E8F5F1] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#2A6B5A]" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#1C1612] mb-3">Quote Request Received!</h2>
            <p className="text-[#6B6155] leading-relaxed mb-8">
              We&apos;ll get back to you within 24 hours with a custom quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="btn-primary px-8 py-3">Back to Home</Link>
              <Link href="/contact" className="btn-ghost px-8 py-3">Book a Call Instead</Link>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="quote-form" className="py-12 lg:py-16 bg-[#F5F0EB] relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="text-center mb-4">
          <p className="section-label mb-4">Get Your Custom Quote</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-[#1C1612] mb-5">
            Tell Us About Your Project
          </h2>
          <p className="text-[#6B6155] text-lg leading-relaxed max-w-xl mx-auto">
            Fill out the form below and we&apos;ll respond within 24 hours with a scoped quote. No templates, no pressure.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 sm:p-10 flex flex-col gap-6" noValidate>

            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="honeypot" type="text" value={form.honeypot} onChange={handleChange} tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Full Name *</label>
                <input id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange} placeholder="Jane Smith" maxLength={100} className={inputClass(!!errors.fullName)} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Business Email *</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" maxLength={100} className={inputClass(!!errors.email)} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Company / Business Name *</label>
              <input id="company" name="company" type="text" value={form.company} onChange={handleChange} placeholder="Acme Corp" maxLength={100} className={inputClass(!!errors.company)} />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="businessType" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Business Type *</label>
                <select id="businessType" name="businessType" value={form.businessType} onChange={handleChange} className={`${inputClass(!!errors.businessType)} appearance-none ${!form.businessType ? 'text-[#9B9088]' : 'text-[#1C1612]'}`}>
                  <option value="" disabled>Select your industry</option>
                  {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>}
              </div>
              <div>
                <label htmlFor="timeline" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Rough Timeline *</label>
                <select id="timeline" name="timeline" value={form.timeline} onChange={handleChange} className={`${inputClass(!!errors.timeline)} appearance-none ${!form.timeline ? 'text-[#9B9088]' : 'text-[#1C1612]'}`}>
                  <option value="" disabled>Select timeline</option>
                  {timelines.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="automationGoal" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">What are you trying to automate? *</label>
              <textarea id="automationGoal" name="automationGoal" value={form.automationGoal} onChange={handleChange} rows={4} placeholder="Describe the repetitive tasks, workflows, or processes you want to automate..." maxLength={2000} className={`${inputClass(!!errors.automationGoal)} resize-none`} />
              {errors.automationGoal && <p className="text-red-500 text-xs mt-1">{errors.automationGoal}</p>}
            </div>

            <div>
              <label htmlFor="currentTools" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">What tools/software do you currently use? *</label>
              <textarea id="currentTools" name="currentTools" value={form.currentTools} onChange={handleChange} rows={3} placeholder="e.g. Salesforce, Google Sheets, QuickBooks, WordPress, Slack..." maxLength={1000} className={`${inputClass(!!errors.currentTools)} resize-none`} />
              {errors.currentTools && <p className="text-red-500 text-xs mt-1">{errors.currentTools}</p>}
            </div>

            {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full min-h-[52px] text-base py-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : <span>Get My Custom Quote</span>}
            </button>

            <p className="text-xs text-[#9B9088] text-center">No spam, ever. Your information is kept confidential.</p>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
