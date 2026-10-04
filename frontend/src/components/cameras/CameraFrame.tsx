import { useMemo } from 'react'
import type { Camera } from '@/types'
import { mulberry32 } from '@/utils/prng'
import { cn } from '@/utils/cn'

const hues: Record<Camera['scene'], number> = { 'open-office': 205, meeting: 235, lobby: 190, workshop: 220, corridor: 215, support: 200 }

interface Person {
  x: number
  y: number
  s: number
  tag: 'person' | 'phone' | 'sleeping'
}

/** Simulated surveillance frame drawn with CSS. Clearly mock — no real video. */
export function CameraFrame({ camera, compact }: { camera: Pick<Camera, 'id' | 'scene' | 'status' | 'employeeCount' | 'phoneCount' | 'sleepingCount' | 'code'>; compact?: boolean }) {
  const people = useMemo<Person[]>(() => {
    const seed = camera.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 7)
    const r = mulberry32(seed)
    const n = Math.min(camera.employeeCount, compact ? 6 : 9)
    return Array.from({ length: n }, (_, i) => {
      const row = Math.floor(i / 3)
      return {
        x: 12 + (i % 3) * 28 + r() * 10,
        y: 36 + row * 20 + r() * 6,
        s: 0.8 + row * 0.18,
        tag: i < camera.phoneCount ? 'phone' : i < camera.phoneCount + camera.sleepingCount ? 'sleeping' : 'person',
      } as Person
    })
  }, [camera.id, camera.employeeCount, camera.phoneCount, camera.sleepingCount, compact])

  const hue = hues[camera.scene]
  const offline = camera.status === 'offline'

  return (
    <div className="cctv-frame aspect-video w-full" aria-hidden>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, hsl(${hue} 30% 14%) 0%, hsl(${hue} 28% 9%) 52%, hsl(${hue} 22% 6%) 100%)` }} />
      {/* perspective floor grid */}
      <div className="absolute inset-x-0 bottom-0 h-[58%] opacity-40" style={{ background: `linear-gradient(rgba(125,211,252,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,.18) 1px, transparent 1px)`, backgroundSize: '36px 24px', transform: 'perspective(260px) rotateX(58deg)', transformOrigin: 'bottom' }} />
      {/* window light */}
      <div className="absolute -top-4 right-[10%] h-[40%] w-[30%] -skew-x-12 opacity-30 blur-md" style={{ background: `linear-gradient(180deg, hsl(${hue} 80% 75%), transparent)` }} />
      {!offline &&
        people.map((p, i) => (
          <div key={i} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `scale(${p.s})`, transformOrigin: 'top left' }}>
            <div className={cn('relative h-[3.2rem] w-[1.6rem] rounded-t-full border', p.tag === 'person' ? 'border-emerald-300/50' : p.tag === 'phone' ? 'border-sky-300/70' : 'border-indigo-300/70')} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.03))' }}>
              <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-white/20" />
              {!compact && p.tag !== 'person' && (
                <span className={cn('absolute -top-5 left-0 whitespace-nowrap rounded px-1 font-mono text-[8px]', p.tag === 'phone' ? 'bg-sky-300/20 text-sky-100' : 'bg-indigo-300/25 text-indigo-100')}>{p.tag === 'phone' ? 'PHONE' : 'DROWSY'}</span>
              )}
            </div>
          </div>
        ))}
      {!offline && <div className="scanline" />}
      {offline && (
        <div className="absolute inset-0 z-[3] grid place-items-center bg-ink-950/60">
          <p className="font-mono text-xs tracking-[.3em] text-slate-400">NO SIGNAL</p>
        </div>
      )}
      <div className="absolute left-2.5 top-2 z-[4] font-mono text-[10px] tracking-wider text-white/70">{camera.code}</div>
      <div className="absolute bottom-2 left-2.5 z-[4] font-mono text-[9px] tracking-wider text-white/50">SIMULATED · DEMO</div>
    </div>
  )
}
