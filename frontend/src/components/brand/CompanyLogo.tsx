import { brand } from '@/config/brand'
import { cn } from '@/utils/cn'

/**
 * The official logo image, unmodified. Only its displayed height changes (via `className`,
 * e.g. "h-9"); width follows the original aspect ratio. The tile matches the image's own
 * off-white background so the logo reads cleanly on the dark UI without altering the file.
 */
export function CompanyLogoMark({ className = 'h-10' }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 rounded-xl bg-[#fefcfd] p-1 ring-1 ring-white/25 shadow-[0_8px_24px_-8px_rgba(0,0,0,.5)]', className)}>
      <img src={brand.logo} alt={`${brand.name} logo`} className="h-full w-auto object-contain" draggable={false} />
    </span>
  )
}

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  align?: 'left' | 'center'
  className?: string
}

const sizes = { sm: { mark: 'h-9', name: 'text-xl' }, md: { mark: 'h-16', name: 'text-[32px]' }, lg: { mark: 'h-16 sm:h-[72px]', name: 'text-[32px] sm:text-4xl' } }

/** Logo + company name + optional tagline. Use this (or `Logo` / `CompanyLogoMark`) everywhere. */
export function CompanyLogo({ size = 'md', showTagline = true, align = 'left', className }: Props) {
  const s = sizes[size]
  return (
    <div className={cn('flex items-center gap-3', align === 'center' && 'justify-center', className)}>
      <CompanyLogoMark className={s.mark} />
      <div className={align === 'center' ? 'text-left' : undefined}>
        <p className={cn('font-auth font-bold leading-none tracking-tight text-white', s.name)}>{brand.name}</p>
        {showTagline && <p className="mt-1.5 hidden whitespace-nowrap text-[11px] leading-none text-slate-200/90 sm:block sm:text-xs">{brand.tagline}</p>}
      </div>
    </div>
  )
}
