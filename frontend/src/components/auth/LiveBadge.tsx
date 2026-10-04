import { useClock } from '@/hooks/useLocalNow'

/** Subtle CCTV-style readout shown over real footage. Decorative. */
export function LiveBadge() {
  const now = useClock()
  return (
    <div className="border-l border-white/25 pl-3 font-mono text-[11px] leading-5 tracking-wider text-white/85" aria-hidden>
      <p>CAM 01 · Office Floor</p>
      <p className="flex items-center gap-1.5"><span className="size-1.5 animate-pulse-soft rounded-full bg-rose-400" />LIVE <span className="ml-1 tabular-nums">{now.toLocaleTimeString('en-GB')}</span></p>
    </div>
  )
}
