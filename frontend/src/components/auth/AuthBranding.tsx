import { Network, Shield, Zap } from 'lucide-react'

const badges = [
  { Icon: Shield, label: 'Secure' },
  { Icon: Zap, label: 'Reliable' },
  { Icon: Network, label: 'Scalable' },
]

/** Left-side marketing copy, sits above the video. */
export function AuthBranding() {
  return (
    <div className="relative mt-16 [text-shadow:0_2px_18px_rgba(2,6,40,.55)] lg:mt-0">
      <h2 className="text-[1.75rem] font-semibold leading-[1.18] tracking-tight sm:text-4xl lg:text-[clamp(2rem,2.75vw,2.75rem)]">
        Smarter Surveillance.
        <br />
        Better <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent [text-shadow:none]">Workforce Management.</span>
      </h2>
      <p className="mt-5 hidden max-w-md text-base leading-relaxed text-slate-100/95 lg:block">
        Monitor live CCTV feeds, manage employee information, oversee multiple store locations, and access powerful insights through one secure platform.
      </p>
      <ul className="mt-9 hidden flex-wrap gap-x-9 gap-y-3 lg:flex">
        {badges.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-2.5 text-sm text-slate-100"><Icon className="size-5 text-sky-300" strokeWidth={1.6} aria-hidden />{label}</li>
        ))}
      </ul>
    </div>
  )
}
