'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'

type MotionPreference = 'system' | 'full' | 'reduced'

type MotionMode = {
  preference: MotionPreference
  reduced: boolean
}

const MotionModeContext = createContext<MotionMode>({ preference: 'system', reduced: false })

export function MotionModeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<MotionPreference>('system')
  const [systemReduced, setSystemReduced] = useState(false)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('motion')
    const nextPreference: MotionPreference = query === 'full' || query === 'reduced' ? query : 'system'
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    setPreference(nextPreference)
    setSystemReduced(media.matches)

    const onChange = (event: MediaQueryListEvent) => setSystemReduced(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const reduced = preference === 'reduced' || (preference === 'system' && systemReduced)

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
    document.documentElement.dataset.motionReduced = String(reduced)
    document.documentElement.classList.add('motion-ready')
  }, [preference, reduced])

  const value = useMemo(() => ({ preference, reduced }), [preference, reduced])
  const reducedMotion = preference === 'full' ? 'never' : preference === 'reduced' ? 'always' : 'user'

  return (
    <MotionModeContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>
    </MotionModeContext.Provider>
  )
}

export function useMotionMode() {
  return useContext(MotionModeContext)
}
