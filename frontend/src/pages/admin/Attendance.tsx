import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AsyncBoundary } from '@/components/ui/States'
import { MetricCard } from '@/components/ui/MetricCard'
import { ChartCard } from '@/components/charts/ChartCard'
import { BarsChart, Ring, TrendArea } from '@/components/charts/Charts'
import { CalendarHeatmap, CalendarLegend } from '@/components/charts/CalendarHeatmap'
import { chartColors } from '@/components/charts/theme'
import { FilterBar, SegmentedControl, Select } from '@/components/ui/Inputs'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatusBadge } from '@/components/ui/Badges'
import { useAsync } from '@/hooks/useAsync'
import { getAttendance, getEmployees, getTrends } from '@/services'
import { MOCK_NOW, REF_DAY_KEY } from '@/data/mock'
import { fmtTime } from '@/utils/format'
import { CalendarCheck, ScanFace, Percent, UserX } from 'lucide-react'
import type { TrendRange } from '@/types'

export default function Attendance() {
  const att = useAsync(getAttendance)
  const emps = useAsync(getEmployees)
  const [range, setRange] = useState<TrendRange>('weekly')
  const trend = useAsync(() => getTrends(range), [range])
  const [dept, setDept] = useState('all')

  const state = useMemo(() => ({ data: att.data && emps.data ? { att: att.data, emps: emps.data } : null, loading: att.loading || emps.loading, error: att.error ?? emps.error, reload: () => { att.reload(); emps.reload() } }), [att, emps])

  return (
    <>
      <PageHeader title="Attendance" subtitle="Detection-based presence across the workplace." actions={<SegmentedControl label="Range" value={range} onChange={setRange} options={[{ value: 'daily', label: 'Today' }, { value: 'weekly', label: 'Week' }, { value: 'monthly', label: 'Month' }]} />} />
      <FilterBar>
        <Select label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="all">All departments</option>
          {[...new Set(emps.data?.map((e) => e.department))].sort().map((d) => <option key={d}>{d}</option>)}
        </Select>
      </FilterBar>
      <AsyncBoundary state={state} skeletonRows={4}>
        {({ att, emps }) => {
          const scope = emps.filter((e) => dept === 'all' || e.department === dept)
          const ids = new Set(scope.map((e) => e.employeeId))
          const todayKey = REF_DAY_KEY
          const today = att.filter((a) => a.date === todayKey && ids.has(a.employeeId))
          const presentToday = today.filter((a) => a.state === 'present')
          const monthKey = todayKey.slice(0, 7)
          const monthRecs = att.filter((a) => ids.has(a.employeeId) && a.date.startsWith(monthKey) && a.state !== 'weekend')
          const monthPct = monthRecs.length ? Math.round((monthRecs.filter((a) => a.state === 'present').length / monthRecs.length) * 100) : 0
          const ratioByDate: Record<string, number> = {}
          const byDate = new Map<string, { p: number; n: number }>()
          for (const a of att) {
            if (!ids.has(a.employeeId) || !a.date.startsWith(monthKey) || a.state === 'weekend') continue
            const cur = byDate.get(a.date) ?? { p: 0, n: 0 }
            cur.n++
            if (a.state === 'present') cur.p++
            byDate.set(a.date, cur)
          }
          byDate.forEach((v, k) => (ratioByDate[k] = v.p / v.n))
          return (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <MetricCard label="Present today" value={presentToday.length} icon={ScanFace} accent="emerald" hint={`of ${scope.length} employees`} />
                <MetricCard label="Not detected today" value={Math.max(0, scope.length - presentToday.length)} icon={UserX} accent="amber" />
                <MetricCard label="Monthly attendance" value={monthPct} suffix="%" icon={Percent} />
                <MetricCard label="Working days logged" value={new Set(monthRecs.map((r) => r.date)).size} icon={CalendarCheck} accent="indigo" />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <ChartCard title="Attendance trend" subtitle="Percentage of employees detected" className="lg:col-span-2">
                  <AsyncBoundary state={trend}>
                    {(d) => <TrendArea data={d} xKey="label" unit="%" series={[{ key: 'attendance', name: 'Attendance', color: chartColors.emerald }]} />}
                  </AsyncBoundary>
                </ChartCard>
                <ChartCard title="Monthly rate" subtitle="This month so far">
                  <div className="grid place-items-center py-4"><Ring value={monthPct} size={168} label="attendance" /></div>
                </ChartCard>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ChartCard title="Calendar" subtitle="Share of employees detected each day">
                  <CalendarHeatmap month={MOCK_NOW} ratioByDate={ratioByDate} />
                </ChartCard>
                <ChartCard title="Detection-based presence" subtitle="Today · first detection time">
                  <ul className="max-h-[22rem] divide-y divide-white/5 overflow-y-auto pr-1">
                    {scope.map((e) => {
                      const rec = today.find((a) => a.employeeId === e.employeeId)
                      return (
                        <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-slate-200">{e.firstName} {e.lastName}</span>
                          <span className="flex items-center gap-3">
                            <span className="font-mono text-xs text-slate-500">{rec?.firstDetectedAt ? fmtTime(rec.firstDetectedAt) : '—'}</span>
                            <StatusBadge status={rec?.state === 'present' ? 'detected' : 'absent'} />
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </ChartCard>
              </div>
              <GlassCard className="mt-4"><CalendarLegend /></GlassCard>
              <ChartCard title="Employees present by day" className="mt-4">
                <AsyncBoundary state={trend}>{(d) => <BarsChart data={d} xKey="label" series={[{ key: 'presence', name: 'Employees present', color: chartColors.cyan }]} />}</AsyncBoundary>
              </ChartCard>
            </>
          )
        }}
      </AsyncBoundary>
    </>
  )
}
