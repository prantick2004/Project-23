import type { CameraActivityPoint, DashboardStats, TrendPoint, TrendRange } from '@/types'
import { ATTENDANCE, CAMERAS, EMPLOYEES, EVENTS, MOCK_NOW, REF_DAY_KEY } from './mock'
import { toDateKey } from '@/utils/format'
import { mulberry32 } from '@/utils/prng'

const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const md = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export function buildDashboardStats(): DashboardStats {
  const todayKey = REF_DAY_KEY
  const today = ATTENDANCE.filter((a) => a.date === todayKey)
  const present = today.filter((a) => a.state === 'present').length
  const working = today.filter((a) => a.state !== 'weekend').length || EMPLOYEES.length
  const todayEvents = EVENTS.filter((e) => toDateKey(new Date(e.timestamp)) === todayKey)
  const r = mulberry32(77)
  const hourlyActivity = Array.from({ length: 10 }, (_, i) => {
    const h = 8 + i
    const hourEvents = todayEvents.filter((e) => new Date(e.timestamp).getHours() === h)
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      employees: Math.round(EMPLOYEES.length * (0.55 + r() * 0.4)),
      phone: hourEvents.filter((e) => e.type === 'phone').length + Math.floor(r() * 3),
      sleeping: hourEvents.filter((e) => e.type === 'sleeping').length + (r() > 0.7 ? 1 : 0),
    }
  })
  return {
    totalEmployees: EMPLOYEES.length,
    detectedNow: EMPLOYEES.filter((e) => e.status === 'detected').length,
    totalCameras: CAMERAS.length,
    onlineCameras: CAMERAS.filter((c) => c.status !== 'offline').length,
    offlineCameras: CAMERAS.filter((c) => c.status === 'offline').length,
    phoneDetections: CAMERAS.reduce((s, c) => s + c.phoneCount, 0),
    sleepingDetections: CAMERAS.reduce((s, c) => s + c.sleepingCount, 0),
    attendanceToday: present,
    attendancePctToday: Math.round((present / working) * 100),
    hourlyActivity,
  }
}

export function buildTrends(range: TrendRange): TrendPoint[] {
  const r = mulberry32(range === 'daily' ? 11 : range === 'weekly' ? 22 : 33)
  if (range === 'daily') {
    return Array.from({ length: 10 }, (_, i) => {
      const h = 8 + i
      const evs = EVENTS.filter(
        (e) => toDateKey(new Date(e.timestamp)) === REF_DAY_KEY && new Date(e.timestamp).getHours() === h,
      )
      return {
        label: `${String(h).padStart(2, '0')}:00`,
        attendance: Math.round(78 + r() * 18),
        phone: evs.filter((e) => e.type === 'phone').length + Math.floor(r() * 3),
        sleeping: evs.filter((e) => e.type === 'sleeping').length + (r() > 0.75 ? 1 : 0),
        presence: Math.round(EMPLOYEES.length * (0.6 + r() * 0.35)),
      }
    })
  }
  const days = range === 'weekly' ? 7 : 30
  const points: TrendPoint[] = []
  for (let n = days - 1; n >= 0; n--) {
    const d = new Date(MOCK_NOW)
    d.setDate(d.getDate() - n)
    const key = toDateKey(d)
    const recs = ATTENDANCE.filter((a) => a.date === key && a.state !== 'weekend')
    if (!recs.length) continue
    const present = recs.filter((a) => a.state === 'present').length
    const evs = EVENTS.filter((e) => toDateKey(new Date(e.timestamp)) === key)
    points.push({
      label: range === 'weekly' ? wd.format(d) : md.format(d),
      attendance: Math.round((present / recs.length) * 100),
      phone: evs.filter((e) => e.type === 'phone').length,
      sleeping: evs.filter((e) => e.type === 'sleeping').length,
      presence: present,
    })
  }
  return points
}

export function buildCameraActivity(): CameraActivityPoint[] {
  return CAMERAS.map((c) => ({
    camera: c.name,
    events: EVENTS.filter((e) => e.cameraId === c.id && e.type !== 'presence').length,
    employees: EVENTS.filter((e) => e.cameraId === c.id && e.type === 'presence').length,
  }))
}
