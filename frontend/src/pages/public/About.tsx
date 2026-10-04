import { FeatureGrid, Section, SectionHeading } from '@/components/marketing/Sections'
import { GlassCard } from '@/components/ui/GlassCard'
import { ButtonLink } from '@/components/ui/Button'
import { pillars } from '@/data/marketing'
import { Reveal } from '@/hooks/useReveal'

export default function About() {
  return (
    <>
      <Section className="pt-36 sm:pt-40">
        <SectionHeading eyebrow="About" title="Workplace intelligence from the cameras you already have" body="PM is a monitoring platform built around CCTV. It detects employees, phone use and drowsiness-related events, then organizes them into attendance insight, incident history and analytics." />
      </Section>
      <Section className="pt-0 sm:pt-0">
        <FeatureGrid items={pillars} />
      </Section>
      <Section className="pt-0 sm:pt-0">
        <Reveal>
          <GlassCard strong className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-white">How it’s organized</h2>
              <p className="mt-3 text-slate-400">The platform has two experiences. Administrators get a complete operational view across cameras, employees and events. Employees get a private view of only their own attendance and detection history.</p>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="rounded-2xl bg-white/[.04] p-4"><b className="text-white">Administrators</b> — dashboard, CCTV monitoring, employee list, attendance, incidents, analytics and settings.</p>
              <p className="rounded-2xl bg-white/[.04] p-4"><b className="text-white">Employees</b> — personal overview, attendance calendar, detection history and profile.</p>
            </div>
          </GlassCard>
        </Reveal>
        <div className="mt-10 flex justify-center"><ButtonLink to="/login">Login to your workspace</ButtonLink></div>
      </Section>
    </>
  )
}
