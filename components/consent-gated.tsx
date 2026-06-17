'use client'

import { useState, useEffect } from 'react'

export function ConsentGated({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted =
      localStorage.getItem('co_cookie_consent') === 'accepted'
    setShow(accepted)
  }, [])

  if (!show) return null

  return <>{children}</>
}
