/**
 * MOCK DATA — fictional people and devices only.
 * Everything here is generated deterministically for demo purposes and must
 * never contain real employee, CCTV or credential data.
 */
import type {
  AttendanceRecord,
  Camera,
  DetectionEvent,
  Employee,
  EmployeeStatus,
  Notification,
} from '@/types'
import { mulberry32 } from '@/utils/prng'
import { toDateKey } from '@/utils/format'

const rand = mulberry32(2310)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

const NOW = new Date()
export const MOCK_NOW = NOW

const people: [string, string, string, string][] = [
  ['Aarav', 'Mehta', 'Engineering', 'Software Engineer'],
  ['Maya', 'Fernandez', 'Engineering', 'Senior Engineer'],
  ['Liam', 'Chen', 'Engineering', 'QA Analyst'],
  ['Sofia', 'Rossi', 'Design', 'Product Designer'],
  ['Noah', 'Williams', 'Operations', 'Operations Lead'],
  ['Isha', 'Kapoor', 'Finance', 'Accountant'],
  ['Omar', 'Haddad', 'Support', 'Support Specialist'],
  ['Elena', 'Petrova', 'HR', 'HR Partner'],
  ['Kenji', 'Watanabe', 'Engineering', 'DevOps Engineer'],
  ['Grace', 'Okafor', 'Sales', 'Account Executive'],
  ['Lucas', 'Silva', 'Operations', 'Logistics Analyst'],
  ['Priya', 'Nair', 'Finance', 'Financial Analyst'],
  ['Ethan', 'Brooks', 'Support', 'Support Specialist'],
  ['Amara', 'Diallo', 'Design', 'UX Researcher'],
  ['Mateo', 'Garcia', 'Sales', 'Sales Associate'],
  ['Hana', 'Kim', 'Engineering', 'Data Engineer'],
  ['Daniel', 'Novak', 'Operations', 'Facilities Coordinator'],
  ['Zara', 'Ahmed', 'HR', 'Recruiter'],
  ['Felix', 'Andersson', 'Engineering', 'Frontend Engineer'],
  ['Naomi', 'Clarke', 'Sales', 'Sales Manager'],
  ['Rohan', 'Verma', 'Support', 'Team Lead'],
  ['Chloe', 'Dubois', 'Finance', 'Controller'],
  ['Tariq', 'Rahman', 'Operations', 'Operations Analyst'],
  ['Mei', 'Lin', 'Design', 'Visual Designer'],
]

export const CAMERAS: Camera[] = (
  [
    ['Main Office', 'Floor 1 · North Wing', 'open-office', 'online'],
    ['Office 02', 'Floor 1 · South Wing', 'open-office', 'online'],
    ['Engineering Bay', 'Floor 2 · East', 'open-office', 'online'],
    ['Meeting Room A', 'Floor 2 · Central', 'meeting', 'online'],
    ['Reception Lobby', 'Ground Floor', 'lobby', 'online'],
    ['Operations Hall', 'Floor 3 · West', 'workshop', 'degraded'],
    ['Corridor B', 'Floor 2 · Link', 'corridor', 'offline'],
    ['Support Desk', 'Floor 3 · East', 'support', 'online'],
  ] as const
).map(([name, location, sceneRaw, status], i) => {
  const scene: Camera['scene'] = sceneRaw
  const online = status !== 'offline'
  const employeeCount = online ? (scene === 'lobby' ? int(1, 4) : scene === 'corridor' ? 0 : int(5, 24)) : 0
  const phoneCount = online && employeeCount > 3 ? int(0, 2) : 0
  const sleepingCount = online && employeeCount > 5 ? int(0, 1) : 0
  return {
    id: `cam-${i + 1}`,
    code: `CAMERA ${String(i + 1).padStart(2, '0')}`,
    name,
    location,
    status,
    scene,
    lastFrameAt: new Date(NOW.getTime() - (online ? int(0, 4) * 1000 : int(40, 90) * 60000)).toISOString(),
    employeeCount,
    phoneCount,
    sleepingCount,
    detectionCount: phoneCount + sleepingCount,
  }
})
// Match the example shown in the product brief for the first camera.
Object.assign(CAMERAS[0], { name: 'Main Office', employeeCount: 24, phoneCount: 2, sleepingCount: 1, detectionCount: 3 })

const statuses: EmployeeStatus[] = ['detected', 'detected', 'detected', 'detected', 'away', 'absent']

/** Date helpers */
const daysAgo = (n: number) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  return d
}
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6
const atTime = (d: Date, h: number, m: number) => {
  const x = new Date(d)
  x.setHours(h, m, 0, 0)
  return x
}
const clampToNow = (d: Date) => (d.getTime() > NOW.getTime() ? new Date(NOW.getTime() - int(2, 40) * 60000) : d)

export const DEMO_EMPLOYEE_ID = 'EMP-1007'

/** Most recent working day (mock data has no weekend attendance, so weekend "today" views use this). */
export const REF_DAY_KEY = (() => {
  const d = new Date(NOW)
  while (isWeekend(d)) d.setDate(d.getDate() - 1)
  return toDateKey(d)
})()

// ── Attendance ──────────────────────────────────────────────────────────────
const attendanceRates = people.map(() => 0.78 + rand() * 0.2)

export const ATTENDANCE: AttendanceRecord[] = []
people.forEach((_, idx) => {
  const employeeId = `EMP-${1001 + idx}`
  for (let n = 0; n < 60; n++) {
    const d = daysAgo(n)
    const key = toDateKey(d)
    if (isWeekend(d)) {
      ATTENDANCE.push({ date: key, employeeId, state: 'weekend' })
      continue
    }
    const r = rand()
    if (n === 0 && idx % 6 === 5) {
      ATTENDANCE.push({ date: key, employeeId, state: 'absent' })
    } else if (r < attendanceRates[idx]) {
      const first = clampToNow(atTime(d, 8 + int(0, 1), int(0, 59)))
      const last = clampToNow(atTime(d, 16 + int(0, 2), int(0, 59)))
      ATTENDANCE.push({
        date: key,
        employeeId,
        state: 'present',
        firstDetectedAt: first.toISOString(),
        lastDetectedAt: last.toISOString(),
        detectedMinutes: Math.max(30, Math.round((last.getTime() - first.getTime()) / 60000) - int(20, 90)),
      })
    } else {
      ATTENDANCE.push({ date: key, employeeId, state: rand() < 0.4 ? 'leave' : 'absent' })
    }
  }
})

// ── Detection events ────────────────────────────────────────────────────────
const onlineCams = CAMERAS.filter((c) => c.status !== 'offline')

export const EVENTS: DetectionEvent[] = []
let evId = 1
const addEvent = (type: DetectionEvent['type'], empIdx: number, when: Date) => {
  const cam = pick(onlineCams)
  const emp = people[empIdx]
  const severity = type === 'presence' ? 'info' : type === 'phone' ? pick(['low', 'low', 'medium'] as const) : 'medium'
  EVENTS.push({
    id: `evt-${evId++}`,
    type,
    employeeId: `EMP-${1001 + empIdx}`,
    employeeName: `${emp[0]} ${emp[1]}`,
    cameraId: cam.id,
    cameraName: cam.name,
    timestamp: clampToNow(when).toISOString(),
    durationSec: type === 'presence' ? 0 : int(20, 600),
    confidence: Math.round((0.82 + rand() * 0.17) * 100) / 100,
    severity,
    status: 'new',
  })
}

for (let n = 0; n < 45; n++) {
  const d = daysAgo(n)
  if (isWeekend(d)) continue
  const phoneToday = int(1, 6)
  const sleepToday = int(0, 2)
  for (let i = 0; i < phoneToday; i++) addEvent('phone', int(0, people.length - 1), atTime(d, int(9, 17), int(0, 59)))
  for (let i = 0; i < sleepToday; i++) addEvent('sleeping', int(0, people.length - 1), atTime(d, int(11, 16), int(0, 59)))
  for (let i = 0; i < 4; i++) addEvent('presence', int(0, people.length - 1), atTime(d, int(8, 17), int(0, 59)))
}
// Guarantee the logged-in demo employee has the example numbers from the brief
// for "this month" while keeping the data otherwise generated.
EVENTS.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
EVENTS.forEach((e, i) => {
  e.status = i < 14 ? 'new' : i % 3 === 0 ? 'dismissed' : 'reviewed'
})

// ── Employees ───────────────────────────────────────────────────────────────
export const EMPLOYEES: Employee[] = people.map(([firstName, lastName, department, jobTitle], idx) => {
  const employeeId = `EMP-${1001 + idx}`
  const records = ATTENDANCE.filter((a) => a.employeeId === employeeId && a.state !== 'weekend').slice(0, 30)
  const present = records.filter((r) => r.state === 'present').length
  const mine = EVENTS.filter((e) => e.employeeId === employeeId)
  const lastSeen = mine.find((e) => e.type === 'presence') ?? mine[0]
  return {
    id: `u-${idx + 1}`,
    employeeId,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@example.test`.toLowerCase(),
    phone: `+1 555 01${String(10 + idx).padStart(2, '0')}`,
    department,
    jobTitle,
    status: statuses[idx % statuses.length],
    lastDetectedAt: lastSeen?.timestamp ?? NOW.toISOString(),
    lastCameraId: lastSeen?.cameraId ?? 'cam-1',
    attendancePct: records.length ? Math.round((present / records.length) * 100) : 0,
    phoneEvents: mine.filter((e) => e.type === 'phone').length,
    sleepingEvents: mine.filter((e) => e.type === 'sleeping').length,
  }
})

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Camera degraded', body: 'Operations Hall is reporting reduced frame rate.', time: new Date(NOW.getTime() - 12 * 60000).toISOString(), read: false },
  { id: 'n2', title: 'Camera offline', body: 'Corridor B has not sent frames for over 40 minutes.', time: new Date(NOW.getTime() - 55 * 60000).toISOString(), read: false },
  { id: 'n3', title: 'Daily summary ready', body: "Yesterday's attendance summary is available.", time: new Date(NOW.getTime() - 20 * 3600000).toISOString(), read: true },
]
