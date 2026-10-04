import { useMemo, useState } from 'react'
import { Mail, Moon, Phone, Smartphone } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AsyncBoundary } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { FilterBar, SearchBar, Select } from '@/components/ui/Inputs'
import { StatusBadge } from '@/components/ui/Badges'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { getCameras, getEmployees } from '@/services'
import { fmtDateTime, timeAgo } from '@/utils/format'
import type { Employee, EmployeeStatus } from '@/types'

type SortKey = 'name' | 'employeeId' | 'department' | 'attendancePct' | 'lastDetectedAt' | 'phoneEvents' | 'sleepingEvents'
const fullName = (e: Employee) => `${e.firstName} ${e.lastName}`

export default function Employees() {
  const state = useAsync(getEmployees)
  const cams = useAsync(getCameras)
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState<'all' | EmployeeStatus>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' })
  const [selected, setSelected] = useState<Employee | null>(null)

  const departments = useMemo(() => [...new Set((state.data ?? []).map((e) => e.department))].sort(), [state.data])
  const rows = useMemo(() => {
    const list = (state.data ?? []).filter((e) => (dept === 'all' || e.department === dept) && (status === 'all' || e.status === status) && `${fullName(e)} ${e.employeeId} ${e.department}`.toLowerCase().includes(q.toLowerCase()))
    const val = (e: Employee) => (sort.key === 'name' ? fullName(e) : e[sort.key])
    return [...list].sort((a, b) => {
      const x = val(a)
      const y = val(b)
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
      return sort.dir === 'asc' ? r : -r
    })
  }, [state.data, q, dept, status, sort])

  const toggle = (key: string) => setSort((s) => ({ key: key as SortKey, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  const camName = (id: string) => cams.data?.find((c) => c.id === id)?.name ?? '—'

  const columns: Column<Employee>[] = [
    { key: 'name', header: 'Employee', sortable: true, cell: (e) => (
      <div className="flex items-center gap-3"><Avatar name={fullName(e)} size="sm" /><div><p className="font-medium text-white">{fullName(e)}</p><p className="text-xs text-slate-500">{e.jobTitle}</p></div></div>
    ) },
    { key: 'employeeId', header: 'ID', sortable: true, hideBelow: 'md', cell: (e) => <span className="font-mono text-xs">{e.employeeId}</span> },
    { key: 'department', header: 'Department', sortable: true, hideBelow: 'lg', cell: (e) => e.department },
    { key: 'status', header: 'Status', cell: (e) => <StatusBadge status={e.status} /> },
    { key: 'lastDetectedAt', header: 'Last detected', sortable: true, hideBelow: 'lg', cell: (e) => <span className="text-slate-400">{timeAgo(e.lastDetectedAt)}</span> },
    { key: 'attendancePct', header: 'Attendance', sortable: true, hideBelow: 'md', cell: (e) => (
      <div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-indigo-300" style={{ width: `${e.attendancePct}%` }} /></div><span className="tabular-nums text-xs">{e.attendancePct}%</span></div>
    ) },
    { key: 'phoneEvents', header: 'Phone', sortable: true, hideBelow: 'lg', className: 'tabular-nums', cell: (e) => e.phoneEvents },
    { key: 'sleepingEvents', header: 'Sleeping', sortable: true, hideBelow: 'lg', className: 'tabular-nums', cell: (e) => e.sleepingEvents },
    { key: 'actions', header: 'Actions', cell: (e) => <button onClick={(ev) => { ev.stopPropagation(); setSelected(e) }} className="rounded-full px-3 py-1 text-xs text-sky-200 hover:bg-white/10">View</button> },
  ]

  return (
    <>
      <PageHeader title="Employees" subtitle="Detection-based status for each employee. All names and details are fictional." />
      <FilterBar>
        <SearchBar value={q} onChange={setQ} placeholder="Search name, ID or department…" label="Search employees" />
        <Select label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="detected">Detected</option>
          <option value="away">Away</option>
          <option value="absent">Not detected</option>
        </Select>
      </FilterBar>
      <AsyncBoundary state={{ ...state, data: state.data && rows }} isEmpty={(d) => d.length === 0} emptyTitle="No employees found" emptyHint="Adjust your search or filters." skeletonRows={5}>
        {(list) => <DataTable caption="Employees" columns={columns} rows={list} rowKey={(e) => e.id} sortKey={sort.key} sortDir={sort.dir} onSort={toggle} onRowClick={setSelected} />}
      </AsyncBoundary>

      <Modal open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected ? fullName(selected) : ''} description={selected ? `${selected.jobTitle} · ${selected.department}` : ''}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar name={fullName(selected)} size="lg" /><div><p className="font-mono text-sm text-slate-300">{selected.employeeId}</p><StatusBadge status={selected.status} /></div></div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><Mail className="size-4 text-slate-500" aria-hidden />{selected.email}</li>
              <li className="flex items-center gap-2"><Phone className="size-4 text-slate-500" aria-hidden />{selected.phone}</li>
            </ul>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/[.04] py-3"><dt className="text-xs text-slate-400">Attendance</dt><dd className="text-lg font-semibold text-white">{selected.attendancePct}%</dd></div>
              <div className="rounded-xl bg-white/[.04] py-3"><dt className="flex items-center justify-center gap-1 text-xs text-slate-400"><Smartphone className="size-3" aria-hidden />Phone</dt><dd className="text-lg font-semibold text-white">{selected.phoneEvents}</dd></div>
              <div className="rounded-xl bg-white/[.04] py-3"><dt className="flex items-center justify-center gap-1 text-xs text-slate-400"><Moon className="size-3" aria-hidden />Drowsy</dt><dd className="text-lg font-semibold text-white">{selected.sleepingEvents}</dd></div>
            </dl>
            <p className="text-xs text-slate-500">Last detected {fmtDateTime(selected.lastDetectedAt)} on {camName(selected.lastCameraId)}</p>
          </div>
        )}
      </Modal>
    </>
  )
}
