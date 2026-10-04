import { Link } from 'react-router-dom'
import { Camera, CameraOff, CalendarCheck, Moon, ScanFace, Smartphone, Users, Video } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { AsyncBoundary } from '@/components/ui/States'
import { ChartCard } from '@/components/charts/ChartCard'
import { BarsChart, Ring, TrendArea } from '@/components/charts/Charts'
import { chartColors } from '@/components/charts/theme'
import { DetectionBadge, StatusBadge } from '@/components/ui/Badges'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAsync } from '@/hooks/useAsync'
import { getCameras, getDashboardStats, getDetectionEvents } from '@/services'
import { fmtTime, timeAgo } from '@/utils/format'

export default function Dashboard() {
  const stats = useAsync(getDashboardStats)
  const cams = useAsync(getCameras)
  const events = useAsync(() => getDetectionEvents())

  return (
    <>
      <PageHeader title="Overview" subtitle="Live summary of employees, cameras and detections for today." />
      <AsyncBoundary state={stats} skeletonRows={4}>
        {(s) => (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <MetricCard label="Total employees" value={s.totalEmployees} icon={Users} accent="indigo" />
              <MetricCard label="Detected now" value={s.detectedNow} icon={ScanFace} accent="emerald" hint="Currently in camera view" />
              <MetricCard label="Total cameras" value={s.totalCameras} icon={Video} />
              <MetricCard label="Online cameras" value={s.onlineCameras} icon={Camera} accent="emerald" />
              <MetricCard label="Offline cameras" value={s.offlineCameras} icon={CameraOff} accent="amber" />
              <MetricCard label="Phone detections" value={s.phoneDetections} icon={Smartphone} hint="Live across cameras" />
              <MetricCard label="Sleeping detections" value={s.sleepingDetections} icon={Moon} accent="indigo" hint="Live across cameras" />
              <MetricCard label="Attendance today" value={s.attendancePctToday} suffix="%" icon={CalendarCheck} accent="emerald" hint={`${s.attendanceToday} of ${s.totalEmployees} detected today`} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <ChartCard title="Today’s activity" subtitle="Employees detected and events by hour" className="lg:col-span-2">
                <TrendArea data={s.hourlyActivity} xKey="hour" series={[{ key: 'employees', name: 'Employees', color: chartColors.cyan }]} />
              </ChartCard>
              <ChartCard title="Attendance today" subtitle="Detection-based presence">
                <div className="grid place-items-center py-4">
                  <Ring value={s.attendancePctToday} size={168} label="present" />
                </div>
              </ChartCard>
            </div>
            <ChartCard title="Events by hour" subtitle="Phone and drowsiness detections today" className="mt-4">
              <BarsChart data={s.hourlyActivity} xKey="hour" height={200} series={[{ key: 'phone', name: 'Phone', color: chartColors.cyan }, { key: 'sleeping', name: 'Drowsiness', color: chartColors.indigo }]} />
            </ChartCard>
          </>
        )}
      </AsyncBoundary>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-white">Cameras</h2>
            <Link to="/admin/cameras" className="text-sm text-sky-200 hover:underline">View all</Link>
          </div>
          <AsyncBoundary state={cams} skeletonRows={3}>
            {(list) => (
              <ul className="divide-y divide-white/5">
                {list.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{c.name}</p>
                      <p className="truncate text-xs text-slate-500">{c.location}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </GlassCard>
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-white">Recent detections</h2>
            <Link to="/admin/incidents" className="text-sm text-sky-200 hover:underline">View all</Link>
          </div>
          <AsyncBoundary state={events} skeletonRows={3}>
            {(list) => (
              <ul className="divide-y divide-white/5">
                {list.filter((e) => e.type !== 'presence').slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{e.employeeName}</p>
                      <p className="truncate text-xs text-slate-500">{e.cameraName} · {fmtTime(e.timestamp)} · {timeAgo(e.timestamp)}</p>
                    </div>
                    <DetectionBadge type={e.type} />
                  </li>
                ))}
              </ul>
            )}
          </AsyncBoundary>
        </GlassCard>
      </div>
    </>
  )
}
