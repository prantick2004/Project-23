import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AsyncBoundary } from '@/components/ui/States'
import { CameraCard } from '@/components/cameras/CameraCard'
import { CameraFrame } from '@/components/cameras/CameraFrame'
import { SearchBar, FilterBar, Select } from '@/components/ui/Inputs'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badges'
import { useAsync } from '@/hooks/useAsync'
import { getCameras } from '@/services'
import { fmtDateTime } from '@/utils/format'
import type { Camera, CameraStatus } from '@/types'

export default function Cameras() {
  const state = useAsync(getCameras)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | CameraStatus>('all')
  const [selected, setSelected] = useState<Camera | null>(null)

  const filtered = useMemo(
    () => (state.data ?? []).filter((c) => (status === 'all' || c.status === status) && `${c.name} ${c.location} ${c.code}`.toLowerCase().includes(q.toLowerCase())),
    [state.data, q, status],
  )

  return (
    <>
      <PageHeader title="CCTV Monitoring" subtitle="Simulated camera frames with live detection counts. No real video is shown in this demo." />
      <FilterBar>
        <SearchBar value={q} onChange={setQ} placeholder="Search cameras…" label="Search cameras" />
        <Select label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="online">Online</option>
          <option value="degraded">Degraded</option>
          <option value="offline">Offline</option>
        </Select>
      </FilterBar>
      <AsyncBoundary state={{ ...state, data: state.data && filtered }} isEmpty={(d) => d.length === 0} emptyTitle="No cameras match" emptyHint="Try a different search or status filter." skeletonRows={3}>
        {(list) => (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <li key={c.id}><CameraCard camera={c} onSelect={setSelected} /></li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
      <Modal open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected?.name ?? ''} description={selected ? `${selected.code} · ${selected.location}` : ''}>
        {selected && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10"><CameraFrame camera={selected} /></div>
            <div className="flex items-center justify-between text-sm">
              <StatusBadge status={selected.status} />
              <span className="text-slate-400">Last frame {fmtDateTime(selected.lastFrameAt)}</span>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[['Employees', selected.employeeCount], ['Phone', selected.phoneCount], ['Drowsy', selected.sleepingCount]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-white/[.04] py-2"><dt className="text-xs text-slate-400">{l}</dt><dd className="text-lg font-semibold text-white">{v}</dd></div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </>
  )
}
