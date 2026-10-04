import { useState, type FormEvent } from 'react'
import { CheckCircle2, Mail, MessageSquare, Send } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Field, TextArea } from '@/components/ui/Inputs'
import { Section, SectionHeading } from '@/components/marketing/Sections'
import { mockLatency } from '@/api/client'

type Errors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>

export default function Contact() {
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const v = (k: string) => String(f.get(k) ?? '').trim()
    const next: Errors = {}
    if (v('name').length < 2) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(v('email'))) next.email = 'Enter a valid email address.'
    if (v('subject').length < 3) next.subject = 'Add a short subject.'
    if (v('message').length < 10) next.message = 'Tell us a little more (10+ characters).'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    await mockLatency(null, 900) // Frontend-only: nothing is actually sent.
    setLoading(false)
    setSent(true)
  }

  return (
    <Section className="pt-36 sm:pt-40">
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionHeading eyebrow="Contact" title="Talk to our team" body="Questions about the platform or a demo? Send us a note and we’ll get back to you." />
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3"><Mail className="size-4 text-sky-200" aria-hidden /> Use the form — we’ll reply by email</li>
            <li className="flex items-center gap-3"><MessageSquare className="size-4 text-sky-200" aria-hidden /> Typical response within two business days</li>
          </ul>
        </div>
        <GlassCard strong className="lg:col-span-3 sm:p-8">
          {sent ? (
            <div role="status" className="py-10 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-200" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold text-white">Message ready</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">Thanks — this demo form doesn’t send anything yet, but this is where your confirmation would appear.</p>
              <Button variant="ghost" className="mt-6" onClick={() => setSent(false)}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" autoComplete="name" error={errors.name} />
              <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
              <Field label="Subject" name="subject" className="sm:col-span-2" error={errors.subject} />
              <TextArea label="Message" name="message" className="sm:col-span-2" error={errors.message} />
              <div className="sm:col-span-2">
                <Button type="submit" loading={loading}><Send className="size-4" aria-hidden /> Send Message</Button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </Section>
  )
}
