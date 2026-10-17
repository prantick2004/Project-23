import type { LucideIcon } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/utils/cn'
import { GlassCard } from './GlassCard'

interface Props {
  label: string
  value: number
  suffix?: string
  icon: LucideIcon
  hint?: string
  accent?: 'cyan' | 'indigo' | 'emerald' | 'amber'
}

const accents = {
  cyan: 'text-sky-200 bg-sky-300/10',
  indigo: 'text-indigo-200 bg-indigo-300/10',
  emerald: 'text-emerald-200 bg-emerald-300/10',
  amber: 'text-amber-200 bg-amber-300/10',
}

export function MetricCard({ label, value, suffix, icon: Icon, hint, accent = 'cyan' }: Props) {
  const v = useCountUp(value)
  return (
    <GlassCard hoverable className="page-enter">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className={cn('grid size-9 place-items-center rounded-xl', accents[accent])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">
        {v}
        {suffix && <span className="ml-0.5 text-xl text-slate-400">{suffix}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </GlassCard>
  )
}
