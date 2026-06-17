'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted =
      localStorage.getItem('co_cookie_consent') === 'accepted' ||
      document.cookie.split(';').some((c) => c.trim() === 'co_cookie_consent=accepted')
    if (accepted) return
    const id = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(id)
  }, [])

  const accept = () => {
    localStorage.setItem('co_cookie_consent', 'accepted')
    document.cookie =
      'co_cookie_consent=accepted; max-age=31536000; SameSite=Lax; Secure; path=/'
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('co_cookie_consent', 'declined')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-4 sm:p-6 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-[rgba(42,107,90,0.12)] p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5F1] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#2A6B5A]" />
              </div>
              <div>
                <p className="font-semibold text-[#1C1612] text-sm mb-1">
                  We use cookies
                </p>
                <p className="text-xs text-[#6B6155] leading-relaxed">
                  We use cookies to improve your experience and analyze site traffic. Read our{' '}
                  <Link href="/privacy" className="text-[#2A6B5A] underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 btn-primary py-2 text-xs rounded-lg"
              >
                Accept All
              </button>
              <button
                onClick={decline}
                className="flex-1 btn-ghost py-2 text-xs rounded-lg"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
