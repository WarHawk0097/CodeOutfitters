'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Mail, MessageCircle, Zap, CheckCircle } from 'lucide-react'

const businessTypes = [
  'Real Estate',
  'Healthcare / Clinic',
  'E-commerce / Retail',
  'Hospitality / Restaurant',
  'Professional Services',
  'Construction / Trades',
  'Marketing / Agency',
  'Other',
]

const contactInfo = [
  { icon: Clock, label: 'Business Hours', value: 'Mon–Fri, 9am–6pm EST' },
  { icon: MessageCircle, label: 'Response Guarantee', value: 'Under 4 hours on business days' },
  { icon: Mail, label: 'Email Us', value: '' },
  { icon: Zap, label: 'Setup Time', value: '7-day delivery, guaranteed' },
]

export function Contact({ hideHeader = false }: { hideHeader?: boolean }) {
  const inputClass = (error: boolean) =>
    `w-full bg-[#FAFAF7] border rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#1C1612] placeholder-[#9B9088] outline-none transition-all duration-200 focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/15 focus:bg-white ${
      error ? 'border-red-400' : 'border-transparent'
    }`
  const [honeypot, setHoneypot] = useState('')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', businessType: '', message: '' })

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@codeoutfitters.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.businessType) e.businessType = 'Please select'
    if (!form.message.trim()) e.message = 'Required'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) { setSubmitted(true); return }
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitError('')
    setLoading(true)
    try {
      if (!process.env.NEXT_PUBLIC_FORMS_WORKER_URL) {
        setSubmitError('Booking temporarily unavailable. Email us directly at hello@codeoutfitters.com')
        setLoading(false)
        return
      }
      // Security 4 (2026-06-16): the browser no longer holds the n8n
      // webhook URL or any n8n secret. The form posts to a Cloudflare
      // Worker which adds the per-form secret header server-side and
      // forwards to the correct n8n webhook URL. The Worker is the
      // source of truth for the per-form routing and secret header.
      const workerUrl = process.env.NEXT_PUBLIC_FORMS_WORKER_URL.replace(/\/+$/, '') + '/'
      const res = await fetch(workerUrl, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'contact', ...form }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong. Please email us directly at hello@codeoutfitters.com')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  return (
    <section id="contact" className="section-depth py-16 md:py-20 px-5 md:px-8 bg-[#F5F0EB] relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto">
        {!hideHeader && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-6"
          >
            <p className="section-label mb-4">Get In Touch</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-balance text-[#1C1612] mb-3">
              Ready to Stop Doing Repetitive Work?
            </h2>
            <p className="text-[#6B6155] text-lg leading-relaxed max-w-xl mx-auto">
              Book your free discovery call. We&apos;ll respond within 4 hours on business days.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col gap-8"
          >
            <div
              className="rounded-2xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #2A6B5A, #2A6B5A)' }}
            >
              <h3 className="font-heading text-2xl font-bold mb-3 tracking-tight">
                Free Workflow Audit Included
              </h3>
              <p className="text-white/80 leading-relaxed text-sm">
                Every discovery call comes with a complimentary workflow audit. We&apos;ll identify your top 3
                automation opportunities at zero cost — no obligation, no hard sell.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="glass-card rounded-xl p-5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#E8F5F1] flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-[#2A6B5A]" />
                    </div>
                    <p className="text-xs text-[#6B6155] uppercase tracking-wide font-medium mb-1">{item.label}</p>
                    {item.label === 'Email Us' ? (
                      <button onClick={copyEmail} className="text-sm font-semibold text-[#1C1612] hover:text-[#2A6B5A] transition-colors duration-200 flex items-center gap-2 group">
                        hello@codeoutfitters.com
                        <span className="text-xs text-[#6B6155] group-hover:text-[#2A6B5A] transition-colors">{copied ? ' Copied!' : 'Copy'}</span>
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-[#1C1612]">{item.value}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {submitted ? (
              <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-[#E8F5F1] flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-[#2A6B5A]" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#1C1612] mb-3">Message Received!</h3>
                <p className="text-[#6B6155] leading-relaxed">
                  Thanks for reaching out. We&apos;ll get back to you within 4 hours with next steps for your free discovery call.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 flex flex-col gap-5" noValidate>
                <input
                  type="text"
                  name="website"
                  style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">First Name</label>
                    <input id="firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} placeholder="Jane" maxLength={100} className={inputClass(!!errors.firstName)} />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Last Name</label>
                    <input id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} placeholder="Smith" maxLength={100} className={inputClass(!!errors.lastName)} />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Work Email</label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@company.com" maxLength={100} className={inputClass(!!errors.email)} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Business Type</label>
                  <select id="businessType" name="businessType" value={form.businessType} onChange={handleChange} className={`${inputClass(!!errors.businessType)} appearance-none ${!form.businessType ? 'text-[#9B9088]' : 'text-[#1C1612]'}`}>
                    <option value="" disabled>Select your industry</option>
                    {businessTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-medium text-[#6B6155] uppercase tracking-wide mb-2">Tell Us About Your Business</label>
                  <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Describe the repetitive tasks you want to automate..." maxLength={2000} className={`${inputClass(!!errors.message)} resize-none`} />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
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
                  ) : <span>Book My Free Discovery Call</span>}
                </button>

                <p className="text-xs text-[#9B9088] text-center">No spam, ever. Unsubscribe anytime.</p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
