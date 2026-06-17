'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) { setStatus('success'); return }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setStatus('loading')
    // Security 4 (2026-06-16): the browser no longer holds the n8n
    // webhook URL or any n8n secret. The form posts to a Cloudflare
    // Worker which adds the per-form secret header server-side and
    // forwards to the correct n8n webhook URL. The Worker is the
    // source of truth for the per-form routing and secret header.
    const workerUrl = process.env.NEXT_PUBLIC_FORMS_WORKER_URL
    if (!workerUrl) { setStatus('error'); return }
    try {
      const res = await fetch(workerUrl.replace(/\/+$/, '') + '/', {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'newsletter' }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="py-[var(--space-section)] bg-[#F5F0EB]">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-label mb-3">Free Weekly Insights</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1C1612] tracking-tight mb-3">
            Automation tips for US small businesses
          </h2>
          <p className="text-[#6B6155] mb-8 text-sm sm:text-base">
            Get one automation idea every Tuesday. No fluff.
          </p>

          {status === 'error' && (
            <p className="text-red-500 text-sm mb-4">Something went wrong. Email us at hello@codeoutfitters.com</p>
          )}
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-[#2A6B5A] font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              You&apos;re in! Check your inbox.
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
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
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={100}
                className="flex-1 bg-white border border-[rgba(42,107,90,0.15)] rounded-xl px-4 py-3 text-sm text-[#1C1612] placeholder-[#9B9088] outline-none focus:border-[#2A6B5A] focus:ring-2 focus:ring-[#2A6B5A]/10 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Subscribe <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
          <p className="text-xs text-[#9B9088] mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
