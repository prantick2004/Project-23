import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AsyncBoundary } from '@/components/ui/States'
import { GlassCard } from '@/components/ui/GlassCard'
import { DetectionBadge } from '@/components/ui/Badges'
import { FilterBar, Select } from '@/components/ui/Inputs'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { getMyDetectionEvents } from '@/services'
import { fmtDate, fmtTime } from '@/utils/format'
import type { DetectionType } from '@/types'

const label = { presence: 'Employee Detected', phone: 'Mobile Phone Detected', sleeping: 'Drowsiness Detected' } as const

export default function History() {
  const { user } = useAuth()
  const state = useAsync(() => getMyDetectionEvents(user!.id), [user!.id])
  const [type, setType] = useState<'all' | DetectionType>('all')
  const list = useMemo(() => (state.data ?? []).filter((e) => type === 'all' || e.type === type), [state.data, type])

  return (
    <>
      <PageHeader title="My Detection History" subtitle="A private, neutral log of detections associated with you." />
      <FilterBar>
        <Select label="Detection type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          <option value="all">All detections</option>
          <option value="presence">Employee detected</option>
          <option value="phone">Mobile phone</option>
          <option value="sleeping">Drowsiness</option>
        </Select>
      </FilterBar>
      <AsyncBoundary state={{ ...state, data: state.data && list }} isEmpty={(d) => d.length === 0} emptyTitle="No detections" emptyHint="Nothing matches this filter." skeletonRows={4}>
        {(rows) => (
          <GlassCard padded={false}>
            <ol className="divide-y divide-white/5">
              {rows.slice(0, 40).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4">
                  <div className="w-20"><p className="font-medium text-white">{fmtDate(e.timestamp)}</p><p className="font-mono text-xs text-slate-500">{fmtTime(e.timestamp)}</p></div>
                  <p className="min-w-24 text-sm text-slate-300">{e.cameraName}</p>
                  <p className="flex-1 text-sm text-slate-200">{label[e.type]}</p>
                  <DetectionBadge type={e.type} />
                </li>
              ))}
            </ol>
          </GlassCard>
        )}
      </AsyncBoundary>
    </>
  )
}
