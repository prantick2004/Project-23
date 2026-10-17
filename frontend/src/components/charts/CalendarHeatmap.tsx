import { useMemo } from 'react'
import type { AttendanceRecord } from '@/types'
import { cn } from '@/utils/cn'

const style: Record<AttendanceRecord['state'], string> = {
  present: 'bg-emerald-300/30 text-emerald-100 border-emerald-300/30',
  absent: 'bg-rose-300/15 text-rose-100/80 border-rose-300/20',
  leave: 'bg-indigo-300/20 text-indigo-100 border-indigo-300/25',
  weekend: 'bg-white/[.03] text-slate-600 border-white/5',
}

interface Props {
  /** One entry per day. For multi-employee views pass a precomputed ratio via `ratioByDate`. */
  records?: AttendanceRecord[]
  ratioByDate?: Record<string, number>
  month: Date
}

const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarHeatmap({ records, ratioByDate, month }: Props) {
  const cells = useMemo(() => {
    const y = month.getFullYear()
    const m = month.getMonth()
    const first = new Date(y, m, 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(y, m + 1, 0).getDate()
    const out: { day: number | null; key?: string }[] = Array.from({ length: offset }, () => ({ day: null }))
    for (let d = 1; d <= days; d++) out.push({ day: d, key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    return out
  }, [month])
  const byDate = useMemo(() => new Map(records?.map((r) => [r.date, r])), [records])

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] text-slate-500">
        {dow.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => {
          if (!c.day) return <span key={i} />
          const rec = c.key ? byDate.get(c.key) : undefined
          const ratio = c.key ? ratioByDate?.[c.key] : undefined
          const label = rec ? `${c.key}: ${rec.state}` : ratio !== undefined ? `${c.key}: ${Math.round(ratio * 100)}% present` : `${c.key}: no data`
          return (
            <div
              key={i}
              title={label}
              aria-label={label}
              className={cn('grid aspect-square place-items-center rounded-xl border text-xs tabular-nums transition-transform hover:scale-105', rec ? style[rec.state] : 'border-white/5 text-slate-600')}
              style={ratio !== undefined ? { background: `rgba(110,231,183,${0.06 + ratio * 0.34})`, color: '#d1fae5', borderColor: 'rgba(110,231,183,.2)' } : undefined}
            >
              {c.day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarLegend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
      {(['present', 'absent', 'leave', 'weekend'] as const).map((s) => (
        <li key={s} className="flex items-center gap-1.5 capitalize">
          <span className={cn('size-3 rounded border', style[s])} aria-hidden /> {s === 'absent' ? 'not detected' : s}
        </li>
      ))}
    </ul>
  )
}
