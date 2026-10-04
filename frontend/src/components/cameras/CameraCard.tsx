import { Moon, Smartphone, Users } from 'lucide-react'
import type { Camera } from '@/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatusBadge } from '@/components/ui/Badges'
import { fmtTime } from '@/utils/format'
import { CameraFrame } from './CameraFrame'

export function CameraCard({ camera, onSelect }: { camera: Camera; onSelect?: (c: Camera) => void }) {
  const body = (
    <>
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <CameraFrame camera={camera} compact />
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-white">{camera.name}</h3>
          <p className="truncate text-xs text-slate-400">
            {camera.code} · {camera.location}
          </p>
        </div>
        <StatusBadge status={camera.status} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { Icon: Users, v: camera.employeeCount, l: 'Employees' },
          { Icon: Smartphone, v: camera.phoneCount, l: 'Phone' },
          { Icon: Moon, v: camera.sleepingCount, l: 'Drowsy' },
        ].map(({ Icon, v, l }) => (
          <div key={l} className="rounded-xl bg-white/[.04] px-2 py-2">
            <dt className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <Icon className="size-3" aria-hidden /> {l}
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] text-slate-500">
        Last frame {fmtTime(camera.lastFrameAt)} · {camera.detectionCount} detection{camera.detectionCount === 1 ? '' : 's'}
      </p>
    </>
  )
  return (
    <GlassCard hoverable padded={false} className="p-4">
      {onSelect ? (
        <button onClick={() => onSelect(camera)} className="block w-full text-left" aria-label={`Open ${camera.name} details`}>
          {body}
        </button>
      ) : (
        body
      )}
    </GlassCard>
  )
}
