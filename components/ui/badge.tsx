import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-1 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#F5F0EB] text-[#6B6155]',
        accent: 'text-[#C8A96E] bg-[rgba(200,169,110,0.12)] border border-[rgba(200,169,110,0.25)]',
        primary: 'text-[#2A6B5A] bg-[rgba(42,107,90,0.08)] border border-[rgba(42,107,90,0.18)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
