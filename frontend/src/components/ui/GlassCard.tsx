import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface Props extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean
  hoverable?: boolean
  padded?: boolean
}

export function GlassCard({ strong, hoverable, padded = true, className, ...rest }: Props) {
  return (
    <div
      className={cn(strong ? 'glass-strong' : 'glass', 'rounded-3xl', hoverable && 'glass-hover', padded && 'p-5 sm:p-6', className)}
      {...rest}
    />
  )
}
