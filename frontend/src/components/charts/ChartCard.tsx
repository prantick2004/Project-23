import type { ReactNode } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

export function ChartCard({ title, subtitle, actions, children, className }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <GlassCard className={className}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </GlassCard>
  )
}
