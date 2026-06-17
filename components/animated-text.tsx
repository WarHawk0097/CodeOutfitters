'use client'

import useScrollReveal from '@/lib/animations/useScrollReveal'

interface Props {
  text: string
  className?: string
  delay?: number
  type?: 'words' | 'chars' | 'lines'
}

export function AnimatedText({ text, className = '', delay = 0, type = 'words' }: Props) {
  const ref = useScrollReveal<HTMLSpanElement>({ direction: 'up', delay, stagger: 0.04 })

  if (type === 'words') {
    const words = text.split(' ')
    return (
      <span ref={ref} className={`inline-block ${className}`}>
        {words.map((word, i) => (
          <span key={i} className="inline-block mr-[0.25em]">
            {word}
          </span>
        ))}
      </span>
    )
  }

  if (type === 'chars') {
    const chars = text.split('')
    return (
      <span ref={ref} className={`inline-block ${className}`}>
        {chars.map((char, i) => (
          <span key={i} className="inline-block">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    )
  }

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {text}
    </span>
  )
}
