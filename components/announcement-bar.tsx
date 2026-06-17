'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '44px', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-50 text-white text-center text-xs sm:text-sm font-medium overflow-hidden flex items-center justify-center px-4"
          style={{ background: 'var(--brand-primary)' }}
        >
          <span className="flex items-center">
            Limited time: Free workflow audit with every Discovery Call 
            <Link href="/contact" className="underline underline-offset-2 ml-1 font-semibold hover:no-underline">
              Book yours 
            </Link>
          </span>
          <button
            onClick={() => setVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
