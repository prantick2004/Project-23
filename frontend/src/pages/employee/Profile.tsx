import { useState, type FormEvent } from 'react'
import { Pencil, Save, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { GlassCard } from '@/components/ui/GlassCard'
import { AsyncBoundary } from '@/components/ui/States'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Inputs'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { getEmployeeProfile, updateEmployeeProfile } from '@/services'

export default function Profile() {
  const { user } = useAuth()
  const state = useAsync(() => getEmployeeProfile(user!.id), [user!.id])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [errs, setErrs] = useState<{ email?: string; phone?: string }>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    const phone = String(f.get('phone')).trim()
    const next: typeof errs = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!/^[+\d][\d\s()-]{6,18}$/.test(phone)) next.phone = 'Enter a valid phone number.'
    setErrs(next)
    if (Object.keys(next).length) return
    setSaving(true)
    await updateEmployeeProfile(user!.id, { email, phone })
    setSaving(false)
    setEditing(false)
    setMsg('Profile updated (demo — changes live only in this session).')
    state.reload()
  }

  return (
    <>
      <PageHeader title="My Profile" subtitle="Only you can see this information." />
      <AsyncBoundary state={state} skeletonRows={2}>
        {(p) => (
          <GlassCard strong className="max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              <Avatar name={`${p.firstName} ${p.lastName}`} size="lg" />
              <div><h2 className="text-xl font-semibold text-white">{p.firstName} {p.lastName}</h2><p className="text-sm text-slate-400">{p.jobTitle} · {p.department}</p></div>
            </div>
            {msg && <p role="status" className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{msg}</p>}
            <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={`${p.firstName} ${p.lastName}`} readOnly />
              <Field label="Employee ID" value={p.employeeId} readOnly />
              <Field label="Role" value="Employee" readOnly />
              <Field label="Department" value={p.department} readOnly />
              <Field label="Email" name="email" type="email" defaultValue={p.email} readOnly={!editing} error={errs.email} key={`e-${editing}-${p.email}`} />
              <Field label="Phone number" name="phone" type="tel" defaultValue={p.phone} readOnly={!editing} error={errs.phone} key={`p-${editing}-${p.phone}`} />
              <div className="flex gap-2 sm:col-span-2">
                {editing ? (
                  <>
                    <Button type="submit" loading={saving}><Save className="size-4" aria-hidden /> Save</Button>
                    <Button type="button" variant="ghost" onClick={() => { setEditing(false); setErrs({}) }}><X className="size-4" aria-hidden /> Cancel</Button>
                  </>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => { setMsg(''); setEditing(true) }}><Pencil className="size-4" aria-hidden /> Edit contact details</Button>
                )}
              </div>
            </form>
          </GlassCard>
        )}
      </AsyncBoundary>
    </>
  )
}
