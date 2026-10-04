import { Moon, Smartphone, UserCheck } from 'lucide-react'
import type { CameraStatus, DetectionType, EmployeeStatus, IncidentStatus, Severity } from '@/types'
import { cn } from '@/utils/cn'

const pill = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium'

const tones = {
  ok: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  warn: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  bad: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
  info: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  violet: 'border-indigo-300/20 bg-indigo-300/10 text-indigo-200',
  mute: 'border-white/10 bg-white/5 text-slate-300',
}

export function Dot({ tone, pulse }: { tone: keyof typeof tones; pulse?: boolean }) {
  const color = { ok: 'bg-emerald-300', warn: 'bg-amber-300', bad: 'bg-rose-300', info: 'bg-sky-300', violet: 'bg-indigo-300', mute: 'bg-slate-400' }[tone]
  return <span className={cn('size-1.5 rounded-full', color, pulse && 'animate-pulse-soft')} aria-hidden />
}

const statusMap: Record<CameraStatus | EmployeeStatus, { label: string; tone: keyof typeof tones }> = {
  online: { label: 'Online', tone: 'ok' },
  degraded: { label: 'Degraded', tone: 'warn' },
  offline: { label: 'Offline', tone: 'mute' },
  detected: { label: 'Detected', tone: 'ok' },
  away: { label: 'Away', tone: 'warn' },
  absent: { label: 'Not detected', tone: 'mute' },
}

export function StatusBadge({ status }: { status: CameraStatus | EmployeeStatus }) {
  const s = statusMap[status]
  return (
    <span className={cn(pill, tones[s.tone])}>
      <Dot tone={s.tone} pulse={status === 'online' || status === 'detected'} />
      {s.label}
    </span>
  )
}

const detMap: Record<DetectionType, { label: string; tone: keyof typeof tones; Icon: typeof Moon }> = {
  phone: { label: 'Mobile phone', tone: 'info', Icon: Smartphone },
  sleeping: { label: 'Drowsiness', tone: 'violet', Icon: Moon },
  presence: { label: 'Employee detected', tone: 'ok', Icon: UserCheck },
}

export function DetectionBadge({ type }: { type: DetectionType }) {
  const d = detMap[type]
  return (
    <span className={cn(pill, tones[d.tone])}>
      <d.Icon className="size-3.5" aria-hidden />
      {d.label}
    </span>
  )
}

const sevMap: Record<Severity, { label: string; tone: keyof typeof tones }> = {
  info: { label: 'Info', tone: 'mute' },
  low: { label: 'Low', tone: 'info' },
  medium: { label: 'Medium', tone: 'warn' },
}
export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = sevMap[severity]
  return (
    <span className={cn(pill, tones[s.tone])}>
      <Dot tone={s.tone} />
      {s.label}
    </span>
  )
}

const incMap: Record<IncidentStatus, { label: string; tone: keyof typeof tones }> = {
  new: { label: 'New', tone: 'info' },
  reviewed: { label: 'Reviewed', tone: 'ok' },
  dismissed: { label: 'Dismissed', tone: 'mute' },
}
export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const s = incMap[status]
  return <span className={cn(pill, tones[s.tone])}>{s.label}</span>
}
