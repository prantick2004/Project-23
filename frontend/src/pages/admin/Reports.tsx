import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AsyncBoundary } from '@/components/ui/States'
import { ChartCard } from '@/components/charts/ChartCard'
import { BarsChart, SimpleLine, TrendArea } from '@/components/charts/Charts'
import { chartColors } from '@/components/charts/theme'
import { SegmentedControl } from '@/components/ui/Inputs'
import { useAsync } from '@/hooks/useAsync'
import { getCameraActivity, getTrends } from '@/services'
import type { TrendRange } from '@/types'

export default function Reports() {
  const [range, setRange] = useState<TrendRange>('weekly')
  const trend = useAsync(() => getTrends(range), [range])
  const cams = useAsync(getCameraActivity)

  return (
    <>
      <PageHeader title="Analytics" subtitle="Trends across attendance, detections and camera activity." actions={<SegmentedControl label="Range" value={range} onChange={setRange} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} />} />
      <AsyncBoundary state={trend} skeletonRows={4} emptyTitle="No data for this range">
        {(d) => (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Attendance trends" subtitle="% of employees detected" className="lg:col-span-2">
              <TrendArea data={d} xKey="label" unit="%" series={[{ key: 'attendance', name: 'Attendance', color: chartColors.emerald }]} />
            </ChartCard>
            <ChartCard title="Phone detections" subtitle="Events per period">
              <BarsChart data={d} xKey="label" series={[{ key: 'phone', name: 'Phone', color: chartColors.cyan }]} />
            </ChartCard>
            <ChartCard title="Sleeping detections" subtitle="Drowsiness events per period">
              <BarsChart data={d} xKey="label" series={[{ key: 'sleeping', name: 'Drowsiness', color: chartColors.indigo }]} />
            </ChartCard>
            <ChartCard title="Employee presence" subtitle="Employees detected">
              <SimpleLine data={d} xKey="label" series={[{ key: 'presence', name: 'Present', color: chartColors.amber }]} />
            </ChartCard>
            <ChartCard title="Camera activity" subtitle="Detection events per camera (last 45 days)">
              <AsyncBoundary state={cams}>
                {(c) => <BarsChart data={c} xKey="camera" series={[{ key: 'events', name: 'Events', color: chartColors.cyan }, { key: 'employees', name: 'Presence logs', color: chartColors.indigo }]} />}
              </AsyncBoundary>
            </ChartCard>
          </div>
        )}
      </AsyncBoundary>
    </>
  )
}
