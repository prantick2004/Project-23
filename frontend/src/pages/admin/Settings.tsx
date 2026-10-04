import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import { Bell, Monitor, Palette, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Inputs'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

function Toggle({ label, hint, defaultChecked }: { label: string; hint: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p id={`${label}-l`} className="text-sm text-white">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      <Switch.Root aria-labelledby={`${label}-l`} defaultChecked={defaultChecked} className="relative h-6 w-11 shrink-0 rounded-full bg-white/15 transition-colors data-[state=checked]:bg-sky-300/70">
        <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  )
}

const sections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'monitoring', label: 'Monitoring', icon: Monitor },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function Settings() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences are UI-only in this demo and are not saved." />
      <Tabs.Root defaultValue="profile" orientation="vertical" className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Tabs.List aria-label="Settings sections" className="glass flex gap-1 overflow-x-auto rounded-3xl p-2 lg:flex-col">
          {sections.map((s) => (
            <Tabs.Trigger key={s.id} value={s.id} className={cn('flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm text-slate-400 transition-colors hover:text-white data-[state=active]:bg-white/12 data-[state=active]:text-white')}>
              <s.icon className="size-4" aria-hidden /> {s.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <GlassCard>
          <Tabs.Content value="profile" className="space-y-4">
            <h2 className="font-medium text-white">Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" defaultValue={user?.name} />
              <Field label="Employee ID" defaultValue={user?.employeeId} readOnly />
              <Field label="Email" type="email" defaultValue={user?.email} className="sm:col-span-2" />
            </div>
            <div className="flex items-center gap-3"><Button onClick={save}>Save changes</Button>{saved && <span role="status" className="text-sm text-emerald-200">Saved (demo)</span>}</div>
          </Tabs.Content>
          <Tabs.Content value="notifications" className="divide-y divide-white/5">
            <h2 className="pb-3 font-medium text-white">Notifications</h2>
            <Toggle label="Camera status changes" hint="When a camera goes offline or degraded." defaultChecked />
            <Toggle label="Detection summaries" hint="A daily digest of phone and drowsiness events." defaultChecked />
            <Toggle label="Weekly attendance report" hint="Delivered every Monday morning." />
          </Tabs.Content>
          <Tabs.Content value="monitoring" className="divide-y divide-white/5">
            <h2 className="pb-3 font-medium text-white">Monitoring preferences</h2>
            <Toggle label="Show detection overlays" hint="Draw labels on simulated camera frames." defaultChecked />
            <Toggle label="Group events by employee" hint="Collapse repeated detections in the incident list." />
            <Toggle label="Auto-refresh dashboard" hint="Keep overview numbers up to date." defaultChecked />
          </Tabs.Content>
          <Tabs.Content value="appearance" className="space-y-3">
            <h2 className="font-medium text-white">Appearance</h2>
            <p className="text-sm text-slate-400">The interface currently uses a single refined dark-glass theme. More themes may come later.</p>
            <div className="glass inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-200"><span className="size-4 rounded-full bg-gradient-to-br from-sky-300 to-indigo-300" aria-hidden /> Glass · Dark</div>
          </Tabs.Content>
          <Tabs.Content value="security" className="space-y-3">
            <h2 className="font-medium text-white">Security</h2>
            <p className="text-sm text-slate-400">Real security settings (sessions, secret-key rotation, access policies) are managed by the backend and will appear here once it’s connected. The demo session lives only in this browser tab.</p>
          </Tabs.Content>
        </GlassCard>
      </Tabs.Root>
    </>
  )
}
