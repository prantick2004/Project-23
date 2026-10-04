import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AsyncBoundary } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar, SearchBar, Select } from '@/components/ui/Inputs'
import { DetectionBadge, IncidentStatusBadge, SeverityBadge } from '@/components/ui/Badges'
import { useAsync } from '@/hooks/useAsync'
import { getDetectionEvents } from '@/services'
import { fmtDateTime } from '@/utils/format'
import type { DetectionEvent, DetectionType, IncidentStatus } from '@/types'

export default function Incidents() {
  const state = useAsync(() => getDetectionEvents())
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | DetectionType>('all')
  const [status, setStatus] = useState<'all' | IncidentStatus>('all')
  const [overrides, setOverrides] = useState<Record<string, IncidentStatus>>({}) // UI-only review state
  const [limit, setLimit] = useState(25)

  const rows = useMemo(
    () =>
      (state.data ?? [])
        .map((e) => ({ ...e, status: overrides[e.id] ?? e.status }))
        .filter((e) => (type === 'all' || e.type === type) && (status === 'all' || e.status === status) && `${e.employeeName} ${e.cameraName} ${e.employeeId}`.toLowerCase().includes(q.toLowerCase())),
    [state.data, q, type, status, overrides],
  )

  const columns: Column<DetectionEvent>[] = [
    { key: 'type', header: 'Detection', cell: (e) => <DetectionBadge type={e.type} /> },
    { key: 'employee', header: 'Employee', cell: (e) => <div><p className="text-white">{e.employeeName}</p><p className="font-mono text-xs text-slate-500">{e.employeeId}</p></div> },
    { key: 'camera', header: 'Camera', hideBelow: 'md', cell: (e) => e.cameraName },
    { key: 'time', header: 'Time', cell: (e) => <span className="whitespace-nowrap text-slate-300">{fmtDateTime(e.timestamp)}</span> },
    { key: 'conf', header: 'Confidence', hideBelow: 'lg', className: 'tabular-nums', cell: (e) => `${Math.round(e.confidence * 100)}%` },
    { key: 'sev', header: 'Severity', hideBelow: 'md', cell: (e) => <SeverityBadge severity={e.severity} /> },
    { key: 'status', header: 'Status', cell: (e) => <IncidentStatusBadge status={e.status} /> },
    { key: 'actions', header: 'Action', cell: (e) => (
      e.status === 'new' ? <button onClick={() => setOverrides((o) => ({ ...o, [e.id]: 'reviewed' }))} className="rounded-full px-3 py-1 text-xs text-sky-200 hover:bg-white/10">Mark reviewed</button> : <span className="text-xs text-slate-600">—</span>
    ) },
  ]

  return (
    <>
      <PageHeader title="Detections & Incidents" subtitle="Review phone, drowsiness and presence events. Review status changes are UI-only in this demo." />
      <FilterBar>
        <SearchBar value={q} onChange={(v) => { setQ(v); setLimit(25) }} placeholder="Search employee, ID or camera…" label="Search detections" />
        <Select label="Detection type" value={type} onChange={(e) => { setType(e.target.value as typeof type); setLimit(25) }}>
          <option value="all">All types</option>
          <option value="phone">Mobile phone</option>
          <option value="sleeping">Drowsiness</option>
          <option value="presence">Employee detected</option>
        </Select>
        <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setLimit(25) }}>
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </Select>
        <p className="ml-auto text-xs text-slate-500" aria-live="polite">{rows.length} result{rows.length === 1 ? '' : 's'}</p>
      </FilterBar>
      <AsyncBoundary state={{ ...state, data: state.data && rows }} isEmpty={(d) => d.length === 0} emptyTitle="No detections found" emptyHint="Try widening your filters." skeletonRows={5}>
        {(list) => (
          <>
            <DataTable caption="Detection events" columns={columns} rows={list.slice(0, limit)} rowKey={(e) => e.id} />
            {list.length > limit && (
              <div className="mt-4 text-center"><button onClick={() => setLimit((l) => l + 25)} className="glass rounded-full px-5 py-2 text-sm text-slate-200 hover:bg-white/10">Show more</button></div>
            )}
          </>
        )}
      </AsyncBoundary>
    </>
  )
}
