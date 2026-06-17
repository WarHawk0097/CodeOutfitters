'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function FloatingCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-6 right-5 z-50 sm:hidden"
        >
          <Link
            href="/contact"
            className="btn-primary flex items-center gap-2 shadow-[0_8px_32px_rgba(42,107,90,0.4)] text-sm py-3 px-5"
          >
            <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
            Book Free Call
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
