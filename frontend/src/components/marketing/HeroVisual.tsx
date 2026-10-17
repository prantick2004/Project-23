import { useRef } from 'react'
import { Moon, Smartphone, UserCheck } from 'lucide-react'
import { prefersReducedMotion } from '@/hooks/useCountUp'

/** CSS-only 3D scene: a surveillance lens over a perspective monitoring grid. */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent) => {
    if (prefersReducedMotion() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.setProperty('--ry', `${x * 14}deg`)
    ref.current.style.setProperty('--rx', `${-y * 10}deg`)
  }
  const reset = () => {
    ref.current?.style.setProperty('--ry', '0deg')
    ref.current?.style.setProperty('--rx', '0deg')
  }
  return (
    <div onPointerMove={onMove} onPointerLeave={reset} className="relative mx-auto aspect-square w-full max-w-[520px] [perspective:1200px]" aria-hidden>
      <div ref={ref} className="absolute inset-0 transition-transform duration-500 ease-out [transform-style:preserve-3d]" style={{ transform: 'rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}>
        {/* floor grid: mask lives on an untransformed wrapper so it clips correctly */}
        <div className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden opacity-60" style={{ maskImage: 'radial-gradient(ellipse at center, #000 25%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 25%, transparent 70%)' }}>
          <div className="absolute inset-x-[-10%] inset-y-0 [transform:perspective(500px)_rotateX(62deg)]" style={{ background: 'linear-gradient(rgba(125,211,252,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,.28) 1px, transparent 1px)', backgroundSize: '44px 44px', transformOrigin: 'bottom' }} />
        </div>
        {/* glow */}
        <div className="absolute left-1/2 top-[42%] size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/20 blur-3xl" />
        {/* lens housing */}
        <div className="absolute left-1/2 top-[40%] size-[64%] -translate-x-1/2 -translate-y-1/2 animate-float [transform:translateZ(40px)]">
          <div className="absolute inset-0 rounded-full border border-white/12 bg-gradient-to-br from-white/10 to-white/[.02] shadow-[0_20px_60px_-10px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.12)]" />
          <div className="absolute inset-[9%] rounded-full border border-white/10 bg-gradient-to-br from-ink-800 to-ink-950 shadow-[inset_0_0_40px_rgba(0,0,0,.6)]" />
          <div className="absolute inset-[20%] rounded-full border border-sky-300/20 bg-[conic-gradient(from_200deg,rgba(125,211,252,.18),rgba(165,180,252,.22),rgba(15,20,35,.9),rgba(125,211,252,.18))]" />
          <div className="absolute inset-[32%] rounded-full border border-white/10 bg-ink-950 shadow-[inset_0_0_24px_rgba(125,211,252,.25)]" />
          <div className="absolute inset-[42%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(186,230,253,.95),rgba(99,102,241,.55)_45%,rgba(9,12,20,.9))] shadow-[0_0_30px_rgba(125,211,252,.55)]" />
          {/* orbit ring + scan */}
          <div className="absolute inset-[-6%] rounded-full border border-dashed border-sky-200/20 [animation:spin_28s_linear_infinite]" />
          <div className="absolute inset-0 overflow-hidden rounded-full"><div className="scanline" /></div>
        </div>
        {/* floating detection chips */}
        <Chip className="left-[-2%] top-[18%] [transform:translateZ(90px)]" delay="0s" icon={<Smartphone className="size-3.5" />} title="Phone detected" meta="CAM 02 · 10:42" tone="sky" />
        <Chip className="right-[-3%] top-[44%] [transform:translateZ(110px)]" delay="1.4s" icon={<UserCheck className="size-3.5" />} title="24 employees present" meta="CAM 01 · Office floor" tone="emerald" />
        <Chip className="bottom-[8%] left-[6%] [transform:translateZ(80px)]" delay="2.6s" icon={<Moon className="size-3.5" />} title="Drowsiness event" meta="CAM 01 · 14:18" tone="indigo" />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){[style*="spin"]{animation:none!important}}`}</style>
    </div>
  )
}

function Chip({ className, icon, title, meta, tone, delay }: { className: string; icon: React.ReactNode; title: string; meta: string; tone: 'sky' | 'emerald' | 'indigo'; delay: string }) {
  const c = { sky: 'text-sky-200 bg-sky-300/15', emerald: 'text-emerald-200 bg-emerald-300/15', indigo: 'text-indigo-200 bg-indigo-300/15' }[tone]
  return (
    <div className={`absolute ${className}`}>
      <div className="glass-strong flex animate-float items-center gap-2.5 rounded-2xl px-3 py-2" style={{ animationDelay: delay }}>
        <span className={`grid size-7 place-items-center rounded-lg ${c}`}>{icon}</span>
        <div>
          <p className="text-xs font-medium text-white">{title}</p>
          <p className="font-mono text-[10px] text-slate-400">{meta}</p>
        </div>
      </div>
    </div>
  )
}
