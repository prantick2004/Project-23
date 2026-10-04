import { initials } from '@/utils/format'
import { cn } from '@/utils/cn'

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-300/25 to-indigo-300/25 font-medium text-sky-100 ring-1 ring-white/10',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-16 text-xl',
      )}
    >
      {initials(name)}
    </span>
  )
}
