'use client'
import { useEffect } from 'react'

export function LiveChat() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const tawkId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
    if (!tawkId || tawkId === 'REPLACE_WITH_TAWK_PROPERTY_ID') return
    const s = document.createElement('script')
    s.async = true
    s.src = `https://embed.tawk.to/${tawkId}/default`
    s.charset = 'UTF-8'
    s.setAttribute('crossorigin', 'anonymous')
    document.head.appendChild(s)

    return () => {
      if (document.head.contains(s)) {
        document.head.removeChild(s)
      }
    }
  }, [])

  return null
}
