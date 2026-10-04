import { CalendarCheck, CalendarX, Percent, ScanFace } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { AsyncBoundary } from '@/components/ui/States'
import { ChartCard } from '@/components/charts/ChartCard'
import { CalendarHeatmap, CalendarLegend } from '@/components/charts/CalendarHeatmap'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { getMyAttendance } from '@/services'
import { MOCK_NOW } from '@/data/mock'
import { fmtDate, fmtTime, toDateKey } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function EmployeeAttendance() {
  const { user } = useAuth()
  const state = useAsync(() => getMyAttendance(user!.id), [user!.id])
  return (
    <>
      <PageHeader title="My Attendance" subtitle="Your detection-based attendance for this month." />
      <AsyncBoundary state={state} isEmpty={(d) => d.length === 0} emptyTitle="No attendance yet" skeletonRows={3}>
        {(all) => {
          const month = toDateKey(MOCK_NOW).slice(0, 7)
          const m = all.filter((a) => a.date.startsWith(month) && a.state !== 'weekend')
          const present = m.filter((a) => a.state === 'present').length
          const recent = all.filter((a) => a.state !== 'weekend').slice(0, 10)
          return (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <MetricCard label="Monthly attendance" value={present} suffix={` / ${m.length}`} icon={CalendarCheck} accent="emerald" />
                <MetricCard label="Days detected" value={present} icon={ScanFace} />
                <MetricCard label="Days not detected" value={m.length - present} icon={CalendarX} accent="amber" />
                <MetricCard label="Attendance" value={m.length ? Math.round((present / m.length) * 100) : 0} suffix="%" icon={Percent} accent="indigo" />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ChartCard title="Calendar view"><CalendarHeatmap month={MOCK_NOW} records={all} /><CalendarLegend /></ChartCard>
                <GlassCard>
                  <h2 className="mb-4 font-medium text-white">Recent attendance history</h2>
                  <ul className="divide-y divide-white/5">
                    {recent.map((r) => (
                      <li key={r.date} className="flex items-center justify-between py-3 text-sm">
                        <span className="text-slate-200">{fmtDate(r.date + 'T12:00:00')}</span>
                        <span className="font-mono text-xs text-slate-500">{r.firstDetectedAt ? `${fmtTime(r.firstDetectedAt)} – ${fmtTime(r.lastDetectedAt!)}` : ''}</span>
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs capitalize', r.state === 'present' ? 'bg-emerald-300/10 text-emerald-200' : r.state === 'leave' ? 'bg-indigo-300/10 text-indigo-200' : 'bg-white/5 text-slate-400')}>{r.state === 'absent' ? 'not detected' : r.state}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>
            </>
          )
        }}
      </AsyncBoundary>
    </>
  )
}
