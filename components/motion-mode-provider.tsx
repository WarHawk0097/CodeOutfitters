'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'

type MotionMode = {
  reduced: boolean
}

const MotionModeContext = createContext<MotionMode>({ reduced: false })

export function MotionModeProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState<boolean>(false)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('motion')
    const isReduced = query === 'reduced'
    setReduced(isReduced)
    document.documentElement.dataset.motion = isReduced ? 'reduced' : 'full'
    document.documentElement.dataset.motionReduced = String(isReduced)
  }, [])

  const value = useMemo(() => ({ reduced }), [reduced])
  const reducedMotion = reduced ? 'always' : 'never'

  return (
    <MotionModeContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>
    </MotionModeContext.Provider>
  )
}

export function useMotionMode() {
  return useContext(MotionModeContext)
}
