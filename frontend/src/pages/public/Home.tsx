import { lazy, Suspense } from 'react'
import { ArrowRight, Camera, Cpu, Fingerprint, Lock, Moon, Smartphone, Users } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Dot } from '@/components/ui/Badges'
import { CameraFrame } from '@/components/cameras/CameraFrame'
import { HeroVisual } from '@/components/marketing/HeroVisual'
import { FeatureGrid, Section, SectionHeading } from '@/components/marketing/Sections'
import { Reveal } from '@/hooks/useReveal'
import { useClock } from '@/hooks/useLocalNow'
import { detectionCards } from '@/data/marketing'

const AnalyticsTeaser = lazy(() => import('@/components/marketing/AnalyticsTeaser'))

function LivePreview() {
  const now = useClock()
  return (
    <GlassCard strong padded={false} className="overflow-hidden p-3 sm:p-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 lg:col-span-3">
          <CameraFrame camera={{ id: 'cam-preview', scene: 'open-office', status: 'online', employeeCount: 9, phoneCount: 2, sleepingCount: 1, code: 'CAMERA 01' }} />
          <p className="absolute right-3 top-2 z-[4] font-mono text-[10px] text-white/70">{now.toLocaleTimeString('en-US', { hour12: false })}</p>
        </div>
        <div className="flex flex-col justify-between gap-4 p-1 lg:col-span-2 lg:p-3">
          <div>
            <p className="font-mono text-xs tracking-widest text-slate-400">CAMERA 01</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Office Floor</h3>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
              <Dot tone="ok" pulse /> ONLINE
            </p>
          </div>
          <dl className="space-y-2.5">
            {[
              { Icon: Users, l: 'Employees detected', v: 24 },
              { Icon: Smartphone, l: 'Phone detection', v: 2 },
              { Icon: Moon, l: 'Sleeping detection', v: 1 },
            ].map(({ Icon, l, v }) => (
              <div key={l} className="flex items-center justify-between rounded-2xl bg-white/[.04] px-4 py-3">
                <dt className="flex items-center gap-2.5 text-sm text-slate-300"><Icon className="size-4 text-sky-200" aria-hidden /> {l}</dt>
                <dd className="text-xl font-semibold tabular-nums text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[11px] text-slate-500">Simulated frame · sample figures for demonstration</p>
        </div>
      </div>
    </GlassCard>
  )
}

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-32 sm:px-6 sm:pt-36 lg:grid-cols-2 lg:gap-6 lg:pb-20">
        <div>
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-slate-300">
            <Dot tone="ok" pulse /> AI-powered CCTV workplace intelligence
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Smarter CCTV Monitoring.</span>
            <br />
            <span className="text-white">Real-Time Workplace Intelligence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            PM turns your existing cameras into a private monitoring layer: employee presence, phone use and drowsiness events, attendance insight and incident history — all in one secure workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/login" size="lg">Get Started <ArrowRight className="size-4" aria-hidden /></ButtonLink>
            <ButtonLink to="/features" variant="ghost" size="lg">Explore Features</ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            {[
              [Camera, 'Multi-camera'],
              [Cpu, 'AI detection'],
              [Lock, 'Sign-in required'],
            ].map(([I, t]) => {
              const Icon = I as typeof Camera
              return <li key={t as string} className="flex items-center gap-2"><Icon className="size-4 text-sky-200" aria-hidden />{t as string}</li>
            })}
          </ul>
        </div>
        <HeroVisual />
      </section>

      <Section id="preview">
        <Reveal>
          <SectionHeading eyebrow="Live monitoring preview" title="Every camera, at a glance" body="A calm, centralized view of what each camera is detecting right now." />
        </Reveal>
        <Reveal className="mt-10"><LivePreview /></Reveal>
      </Section>

      <Section>
        <Reveal><SectionHeading eyebrow="AI detection" title="Events, not endless footage" body="Detection turns hours of video into a short, reviewable list of meaningful events." /></Reveal>
        <div className="mt-10"><FeatureGrid items={detectionCards} /></div>
      </Section>

      <Section>
        <Reveal><SectionHeading eyebrow="Analytics preview" title="Trends that explain the workplace" body="Administrators get charts for attendance, detections and camera activity. The figures below are an illustrative sample." /></Reveal>
        <Reveal className="mt-10">
          <Suspense fallback={<div className="skeleton h-72" />}><AnalyticsTeaser /></Suspense>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <GlassCard strong className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Security</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Private until you sign in</h2>
              <p className="mt-4 text-slate-400">Employee details, camera footage, detection history and attendance records are never shown on public pages. They are available only after authentication, and employees can only ever see their own records.</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                [Lock, 'Authenticated access only'],
                [Fingerprint, 'Role-based views'],
                [Users, 'Employees see only themselves'],
                [Camera, 'No public camera feeds'],
              ].map(([I, t]) => {
                const Icon = I as typeof Lock
                return (
                  <li key={t as string} className="flex items-center gap-3 rounded-2xl bg-white/[.04] px-4 py-3.5 text-sm text-slate-200">
                    <Icon className="size-4 shrink-0 text-emerald-200" aria-hidden /> {t as string}
                  </li>
                )
              })}
            </ul>
          </GlassCard>
        </Reveal>
      </Section>

      <Section className="pb-8">
        <Reveal>
          <div className="glass-strong relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:py-20">
            <div className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden />
            <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ready to see your workplace clearly?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-slate-400">Sign in to open your private monitoring workspace.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/login" size="lg">Login</ButtonLink>
              <ButtonLink to="/contact" variant="ghost" size="lg">Contact us</ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
