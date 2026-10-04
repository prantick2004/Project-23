const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' })
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export const fmtTime = (iso: string) => timeFmt.format(new Date(iso))
export const fmtDate = (iso: string) => dateFmt.format(new Date(iso))
export const fmtDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const fmtPct = (n: number) => `${Math.round(n)}%`

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
