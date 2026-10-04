/**
 * DATA SERVICES — MOCK IMPLEMENTATIONS.
 * Every function here returns mock data from `@/data`. Swap each body for a
 * real API call later; keep the signatures so pages/components stay untouched.
 */
import { mockLatency, ServiceError } from '@/api/client'
import { buildCameraActivity, buildDashboardStats, buildTrends } from '@/data/analytics'
import { ATTENDANCE, CAMERAS, EMPLOYEES, EVENTS, MOCK_NOW, NOTIFICATIONS } from '@/data/mock'
import type {
  AttendanceRecord,
  Camera,
  CameraActivityPoint,
  DashboardStats,
  DetectionEvent,
  DetectionType,
  Employee,
  EmployeeSummary,
  Notification,
  TrendPoint,
  TrendRange,
} from '@/types'
import { toDateKey } from '@/utils/format'

export { authService } from './auth'

// ── Admin-scoped ────────────────────────────────────────────────────────────
export const getDashboardStats = (): Promise<DashboardStats> => mockLatency(buildDashboardStats())
export const getEmployees = (): Promise<Employee[]> => mockLatency(EMPLOYEES)
export const getCameras = (): Promise<Camera[]> => mockLatency(CAMERAS)

export interface EventQuery {
  type?: DetectionType
}
export const getDetectionEvents = (q: EventQuery = {}): Promise<DetectionEvent[]> =>
  mockLatency(q.type ? EVENTS.filter((e) => e.type === q.type) : EVENTS)

export const getAttendance = (): Promise<AttendanceRecord[]> => mockLatency(ATTENDANCE)
export const getTrends = (range: TrendRange): Promise<TrendPoint[]> => mockLatency(buildTrends(range))
export const getCameraActivity = (): Promise<CameraActivityPoint[]> => mockLatency(buildCameraActivity())
export const getNotifications = (): Promise<Notification[]> => mockLatency(NOTIFICATIONS, 150)

// ── Employee-scoped: the caller's own id is ALWAYS required.
// A real backend must derive this from the authenticated session, not the client.
export const getEmployeeProfile = async (employeeUserId: string): Promise<Employee> => {
  const e = EMPLOYEES.find((x) => x.id === employeeUserId)
  if (!e) throw new ServiceError('Profile not found.', 'not_found')
  return mockLatency(e)
}

export const updateEmployeeProfile = async (
  employeeUserId: string,
  patch: Pick<Employee, 'email' | 'phone'>,
): Promise<Employee> => {
  const e = EMPLOYEES.find((x) => x.id === employeeUserId)
  if (!e) throw new ServiceError('Profile not found.', 'not_found')
  Object.assign(e, patch) // UI-only: lives in memory until reload
  return mockLatency(e, 600)
}

export const getMyAttendance = async (employeeUserId: string): Promise<AttendanceRecord[]> => {
  const e = EMPLOYEES.find((x) => x.id === employeeUserId)
  return mockLatency(e ? ATTENDANCE.filter((a) => a.employeeId === e.employeeId) : [])
}

export const getMyDetectionEvents = async (employeeUserId: string): Promise<DetectionEvent[]> => {
  const e = EMPLOYEES.find((x) => x.id === employeeUserId)
  return mockLatency(e ? EVENTS.filter((v) => v.employeeId === e.employeeId) : [])
}

export const getMySummary = async (employeeUserId: string): Promise<EmployeeSummary> => {
  const e = EMPLOYEES.find((x) => x.id === employeeUserId)
  if (!e) throw new ServiceError('Profile not found.', 'not_found')
  const month = toDateKey(MOCK_NOW).slice(0, 7)
  const recs = ATTENDANCE.filter((a) => a.employeeId === e.employeeId && a.date.startsWith(month) && a.state !== 'weekend')
  const events = EVENTS.filter((v) => v.employeeId === e.employeeId && v.timestamp.startsWith(month))
  const present = recs.filter((r) => r.state === 'present').length
  return mockLatency({
    daysAttended: present,
    workingDays: recs.length,
    daysDetected: present,
    attendancePct: recs.length ? Math.round((present / recs.length) * 100) : 0,
    phoneEvents: events.filter((v) => v.type === 'phone').length,
    sleepingEvents: events.filter((v) => v.type === 'sleeping').length,
  })
}
