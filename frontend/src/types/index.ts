export type Role = 'admin' | 'employee'

export interface SessionUser {
  id: string
  role: Role
  name: string
  employeeId: string
  email: string
}

export type EmployeeStatus = 'detected' | 'away' | 'absent'

export interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  jobTitle: string
  status: EmployeeStatus
  lastDetectedAt: string
  lastCameraId: string
  attendancePct: number
  phoneEvents: number
  sleepingEvents: number
}

export type CameraStatus = 'online' | 'offline' | 'degraded'

export interface Camera {
  id: string
  code: string
  name: string
  location: string
  status: CameraStatus
  lastFrameAt: string
  employeeCount: number
  detectionCount: number
  phoneCount: number
  sleepingCount: number
  /** Hue seed used to render the simulated frame. */
  scene: 'open-office' | 'meeting' | 'lobby' | 'workshop' | 'corridor' | 'support'
}

export type DetectionType = 'phone' | 'sleeping' | 'presence'
export type Severity = 'info' | 'low' | 'medium'
export type IncidentStatus = 'new' | 'reviewed' | 'dismissed'

export interface DetectionEvent {
  id: string
  type: DetectionType
  employeeId: string
  employeeName: string
  cameraId: string
  cameraName: string
  timestamp: string
  durationSec: number
  confidence: number
  severity: Severity
  status: IncidentStatus
}

export type AttendanceState = 'present' | 'absent' | 'weekend' | 'leave'

export interface AttendanceRecord {
  date: string // YYYY-MM-DD
  employeeId: string
  state: AttendanceState
  firstDetectedAt?: string
  lastDetectedAt?: string
  detectedMinutes?: number
}

export interface DashboardStats {
  totalEmployees: number
  detectedNow: number
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  phoneDetections: number
  sleepingDetections: number
  attendanceToday: number
  attendancePctToday: number
  hourlyActivity: { hour: string; employees: number; phone: number; sleeping: number }[]
}

export interface TrendPoint {
  label: string
  attendance: number
  phone: number
  sleeping: number
  presence: number
}

export type TrendRange = 'daily' | 'weekly' | 'monthly'

export interface CameraActivityPoint {
  camera: string
  events: number
  employees: number
}

export interface EmployeeSummary {
  daysAttended: number
  workingDays: number
  daysDetected: number
  attendancePct: number
  phoneEvents: number
  sleepingEvents: number
}

export interface Notification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}
