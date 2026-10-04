import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'ghost' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap'
const variants: Record<Variant, string> = {
  primary:
    'text-ink-950 bg-gradient-to-r from-cyan-200 to-indigo-200 hover:from-cyan-100 hover:to-indigo-100 shadow-[0_8px_30px_-8px_rgba(125,211,252,.5)] hover:-translate-y-0.5',
  ghost: 'glass text-slate-100 hover:bg-white/10 hover:-translate-y-0.5',
  subtle: 'text-slate-300 hover:text-white hover:bg-white/8',
}
const sizes: Record<Size, string> = { sm: 'h-9 px-4 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-12 px-7 text-base' }

interface Common {
  variant?: Variant
  size?: Size
  className?: string
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...rest
}: Common & { loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: Common & LinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...rest} />
}
