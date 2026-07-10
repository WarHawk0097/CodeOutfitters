import * as React from 'react'
import { cn } from '@/lib/utils'

function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8', className)}>
      {children}
    </div>
  )
}

function BentoCard({
  className,
  span = 6,
  children,
}: {
  className?: string
  span?: 4 | 5 | 6 | 7 | 8 | 12
  children: React.ReactNode
}) {
  const spanClass: Record<number, string> = {
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
    12: 'md:col-span-12',
  }
  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-[rgba(28,22,18,0.06)] overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-premium hover:shadow-premium-lg col-span-1',
        spanClass[span],
        className
      )}
    >
      {children}
    </div>
  )
}

export { BentoGrid, BentoCard }
