import { useMemo } from 'react'
import { Store, UsersRound, Video } from 'lucide-react'
import { mulberry32 } from '@/utils/prng'

/** Illustrated dusk office scene (pure SVG/CSS) — decorative only. */
export function AuthScene() {
  const windows = useMemo(() => {
    const r = mulberry32(5)
    const out: { x: number; y: number; lit: boolean; warm: boolean }[] = []
    for (let row = 0; row < 11; row++)
      for (let col = 0; col < 12; col++) out.push({ x: 8 + col * 27, y: 18 + row * 33, lit: r() > 0.38, warm: r() > 0.45 })
    return out
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <svg viewBox="0 0 800 1024" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#081a63" />
            <stop offset=".38" stopColor="#1a2a96" />
            <stop offset=".58" stopColor="#4b3fa8" />
            <stop offset=".7" stopColor="#a1599f" />
            <stop offset=".78" stopColor="#d7839a" />
            <stop offset="1" stopColor="#101a63" />
          </linearGradient>
          <linearGradient id="bld" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#0a1b52" />
            <stop offset="1" stopColor="#2a3f9a" />
          </linearGradient>
          <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b2b77" />
            <stop offset="1" stopColor="#0a1250" />
          </linearGradient>
          <radialGradient id="glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#f9a8d4" stopOpacity=".55" />
            <stop offset="1" stopColor="#f9a8d4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="1024" fill="url(#sky)" />
        <ellipse cx="520" cy="610" rx="420" ry="120" fill="url(#glow)" />
        {/* far trees */}
        <g fill="#13266f" opacity=".9">
          {[0, 90, 190, 300, 420, 560, 680, 780].map((x, i) => (
            <ellipse key={i} cx={x} cy={600 + (i % 2) * 14} rx={60 + (i % 3) * 14} ry={52} />
          ))}
        </g>
        {/* building */}
        <g transform="translate(-50 120) scale(1.22)">
          <path d="M0 140 L330 40 L360 40 L360 480 L0 480 Z" fill="url(#bld)" />
          <path d="M0 140 L330 40 L330 74 L0 176 Z" fill="#c7d2fe" opacity=".18" />
          <g transform="translate(14 120)">
            {windows.map((w, i) => (
              <rect key={i} x={w.x} y={w.y * 0.9 + (w.x * -0.12 + 20)} width="18" height="24" rx="1.500" fill={w.lit ? (w.warm ? '#fcd9a1' : '#9fb6ff') : '#1a2d7a'} opacity={w.lit ? 0.85 : 0.6} />
            ))}
          </g>
          <rect x="0" y="446" width="360" height="40" fill="#fde7bd" opacity=".35" />
        </g>
        {/* near trees */}
        <g>
          <ellipse cx="60" cy="560" rx="70" ry="110" fill="#0b1a55" />
          <ellipse cx="150" cy="590" rx="55" ry="90" fill="#0e2260" />
          <ellipse cx="740" cy="640" rx="90" ry="70" fill="#0b1a55" />
          <ellipse cx="620" cy="700" rx="70" ry="38" fill="#14307a" />
        </g>
        {/* ground + path */}
        <path d="M0 660 L800 650 L800 1024 L0 1024 Z" fill="url(#gnd)" />
        <path d="M120 1024 C 220 840 330 720 520 690 C 640 672 740 670 800 690 L800 740 C 700 726 600 746 520 790 C 420 850 380 940 380 1024 Z" fill="#334bb0" opacity=".55" />
        <g fill="#fbbf6a" opacity=".85">
          {[[300, 700], [250, 748], [500, 650], [560, 640], [200, 770]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" />
          ))}
        </g>
        <rect y="760" width="800" height="264" fill="#0a1250" opacity=".35" />
        {/* CCTV camera */}
        <g transform="translate(560 70) rotate(14)">
          <path d="M120 150 Q 160 170 180 210 L170 240 L140 220 Z" fill="#3b4aa8" />
          <rect x="0" y="40" width="200" height="86" rx="43" fill="#aab4f5" />
          <rect x="0" y="40" width="200" height="86" rx="43" fill="url(#cam)" />
          <rect x="10" y="40" width="190" height="20" rx="10" fill="#e5e9ff" opacity=".7" />
          <ellipse cx="42" cy="86" rx="46" ry="52" fill="#0a1546" stroke="#38bdf8" strokeWidth="5" />
          <ellipse cx="42" cy="86" rx="30" ry="36" fill="#0b2a80" />
          <ellipse cx="42" cy="86" rx="14" ry="18" fill="#6c7bff" opacity=".8" />
          <rect x="80" y="130" width="40" height="30" fill="#6674d8" />
          <defs>
            <linearGradient id="cam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9d1ff" stopOpacity=".1" />
              <stop offset="1" stopColor="#3b4aa8" stopOpacity=".55" />
            </linearGradient>
          </defs>
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1250]/90 via-transparent to-transparent" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#081046]/80 to-transparent" />
    </div>
  )
}

const stats = [
  { Icon: UsersRound, label: 'Employees', value: '256+' },
  { Icon: Store, label: 'Stores', value: '12+' },
  { Icon: Video, label: 'Cameras', value: '48+' },
]

function GlassPanel({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute rounded-3xl border border-white/20 bg-gradient-to-br from-white/20 to-white/[.06] shadow-[0_20px_60px_-10px_rgba(5,10,60,.7),inset_0_1px_0_rgba(255,255,255,.3)] backdrop-blur-md ${className}`}>{children}</div>
  )
}

/** Floating glass cards over the scene (large screens only). Illustrative sample figures. */
export function AuthFloatingPanels() {
  return (
    <>
      <GlassPanel className="left-[29%] top-[32.5%] w-[23%] -rotate-[4deg] p-[2.4%] [transform:perspective(900px)_rotateY(14deg)_rotate(-3deg)]">
        <ul className="space-y-[7%]">
          {stats.map(({ Icon, label, value }) => (
            <li key={label} className="flex items-center gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
              <Icon className="size-9 shrink-0 text-indigo-200" strokeWidth={1.6} aria-hidden />
              <div>
                <p className="text-[11px] text-slate-200">{label}</p>
                <p className="font-auth text-xl font-medium text-white">{value}</p>
              </div>
            </li>
          ))}
        </ul>
      </GlassPanel>
      <GlassPanel className="left-[56.500%] top-[26%] w-[31.500%] p-[1.800%] [transform:perspective(900px)_rotateY(-16deg)_rotateZ(4deg)]">
        <div className="mb-2 flex items-center justify-between text-xs text-white">
          <span className="font-auth">Live Camera</span>
          <span className="flex items-center gap-1.5 text-[10px]"><span className="size-1.5 rounded-full bg-emerald-300" />Online</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="aspect-[4/3] rounded-sm" style={{ background: `linear-gradient(${140 + i * 12}deg, hsl(${215 + (i % 3) * 8} 35% ${34 + (i % 4) * 5}%), hsl(${230 + (i % 2) * 10} 40% 18%))`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)' }} />
          ))}
        </div>
      </GlassPanel>
    </>
  )
}
