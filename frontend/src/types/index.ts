// ============================================================================
// Domain types — mirror (loosely) the existing Python backend's schemas.
// These are frontend contracts only; no network calls are made yet.
// When the backend is connected, keep these interfaces in sync with
// app/schemas/*.py response models.
// ============================================================================

export type EmployeeStatus = "active" | "inactive" | "suspended" | "terminated";

export interface Employee {
  id: string;
  employeeId: string; // e.g. "EMP-0001"
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  storeId: string;
  storeName: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  photoUrl?: string;
  joinedAt: string;
}

export type CameraStatus = "online" | "offline" | "connecting" | "error";
export type CameraType = "usb" | "ip" | "rtsp" | "cctv";

export interface Camera {
  id: string;
  cameraId: string; // e.g. "CAM-LOBBY-01"
  name: string;
  storeId: string;
  storeName: string;
  type: CameraType;
  status: CameraStatus;
  location: string;
  previewImage?: string;
}

export interface Store {
  id: string;
  storeId: string;
  name: string;
  address: string;
  managerName: string;
  employeeCount: number;
  cameraCount: number;
  status: "active" | "inactive";
}

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  storeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  durationHours?: number;
}

export type ActivityType =
  | "entry_event"
  | "exit_event"
  | "zone_event"
  | "activity_detected"
  | "review_required";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  employeeName?: string;
  storeName: string;
  cameraName: string;
  timestamp: string;
  status: "new" | "reviewed" | "review_required" | "dismissed";
}

export type AlertSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface AlertItem {
  id: string;
  type: string;
  severity: AlertSeverity;
  storeName: string;
  cameraName?: string;
  timestamp: string;
  status: "unread" | "read" | "resolved";
  message: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalStores: number;
  onlineCameras: number;
  offlineCameras: number;
  todayAttendance: number;
}

export interface ReportDefinition {
  id: string;
  title: string;
  type: "employee_activity" | "attendance" | "store" | "cctv_status" | "alerts";
  description: string;
}

export type UserRole = "admin" | "employee";
