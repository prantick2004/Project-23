import { CalendarCheck, Moon, ScanFace, Smartphone } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { AsyncBoundary } from '@/components/ui/States'
import { GlassCard } from '@/components/ui/GlassCard'
import { DetectionBadge } from '@/components/ui/Badges'
import { Ring } from '@/components/charts/Charts'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { getMyDetectionEvents, getMySummary } from '@/services'
import { fmtDateTime } from '@/utils/format'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const id = user!.id
  const summary = useAsync(() => getMySummary(id), [id])
  const events = useAsync(() => getMyDetectionEvents(id), [id])

  return (
    <>
      <PageHeader title={`Welcome, ${user!.name.split(' ')[0]}`} subtitle="Your personal attendance and detection summary for this month. Only you can see this." />
      <AsyncBoundary state={summary} skeletonRows={3}>
        {(s) => (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard strong className="flex items-center gap-6 lg:row-span-1">
              <Ring value={s.attendancePct} size={132} label="attendance" />
              <div>
                <p className="text-sm text-slate-400">Your Attendance</p>
                <p className="mt-1 text-2xl font-semibold text-white tabular-nums">{s.daysAttended} <span className="text-slate-500">/ {s.workingDays} days</span></p>
              </div>
            </GlassCard>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2 lg:grid-cols-4">
              <MetricCard label="Days attended" value={s.daysAttended} icon={CalendarCheck} accent="emerald" />
              <MetricCard label="CCTV detection" value={s.daysDetected} suffix=" days" icon={ScanFace} />
              <MetricCard label="Phone events" value={s.phoneEvents} icon={Smartphone} />
              <MetricCard label="Sleeping events" value={s.sleepingEvents} icon={Moon} accent="indigo" />
            </div>
          </div>
        )}
      </AsyncBoundary>
      <GlassCard className="mt-4">
        <h2 className="mb-4 font-medium text-white">Recent activity</h2>
        <AsyncBoundary state={events} isEmpty={(d) => d.length === 0} emptyTitle="No recent activity" skeletonRows={3}>
          {(list) => (
            <ul className="divide-y divide-white/5">
              {list.slice(0, 6).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div><p className="text-sm text-white">{fmtDateTime(e.timestamp)}</p><p className="text-xs text-slate-500">{e.cameraName}</p></div>
                  <DetectionBadge type={e.type} />
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </GlassCard>
    </>
  )
}
