import type { ReactNode } from 'react'
import type { Feature } from '@/data/marketing'
import { GlassCard } from '@/components/ui/GlassCard'
import { Reveal } from '@/hooks/useReveal'

export function SectionHeading({ eyebrow, title, body, center }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-slate-400">{body}</p>}
    </div>
  )
}

export function Section({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      {children}
    </section>
  )
}

export function FeatureGrid({ items, cols = 4 }: { items: Feature[]; cols?: 2 | 3 | 4 }) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols]
  return (
    <ul className={`grid gap-4 ${grid}`}>
      {items.map((f, i) => (
        <li key={f.title}>
          <Reveal delay={i * 60} className="h-full">
            <GlassCard hoverable className="h-full">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-300/20 to-indigo-300/20 text-sky-100 ring-1 ring-white/10">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-medium text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </GlassCard>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
