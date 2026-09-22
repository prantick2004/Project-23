import { AttendanceRecord, ActivityEvent, AlertItem, DashboardStats, ReportDefinition } from "@/types";
import { mockEmployees } from "./employees";
import { mockCameras } from "./cameras";
import { mockStores } from "./stores";

const attStatuses: AttendanceRecord["status"][] = ["present", "present", "present", "late", "absent", "half_day"];

export const mockAttendance: AttendanceRecord[] = mockEmployees.slice(0, 30).map((e, i) => {
  const status = attStatuses[i % attStatuses.length];
  const hasIn = status !== "absent";
  return {
    id: `att_${i + 1}`,
    employeeId: e.employeeId,
    employeeName: `${e.firstName} ${e.lastName}`,
    storeName: e.storeName,
    date: `2026-09-${String((i % 20) + 1).padStart(2, "0")}`,
    checkIn: hasIn ? `0${8 + (i % 2)}:${String((i * 7) % 60).padStart(2, "0")} AM` : undefined,
    checkOut: hasIn && status !== "half_day" ? `0${5 + (i % 3)}:${String((i * 11) % 60).padStart(2, "0")} PM` : undefined,
    status,
    durationHours: hasIn ? Number((7 + (i % 3) + (i % 60) / 100).toFixed(1)) : undefined,
  };
});

const activityTypes: ActivityEvent["type"][] = ["entry_event", "exit_event", "zone_event", "activity_detected", "review_required"];

export const mockActivities: ActivityEvent[] = Array.from({ length: 28 }).map((_, i) => {
  const emp = mockEmployees[i % mockEmployees.length];
  const cam = mockCameras[i % mockCameras.length];
  return {
    id: `act_${i + 1}`,
    type: activityTypes[i % activityTypes.length],
    employeeName: `${emp.firstName} ${emp.lastName}`,
    storeName: cam.storeName,
    cameraName: cam.name,
    timestamp: `2026-09-${String((i % 20) + 1).padStart(2, "0")} ${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
    status: i % 4 === 0 ? "review_required" as any : i % 3 === 0 ? "reviewed" : "new",
  };
});

const alertTypes = ["Camera Offline", "Camera Reconnected", "Activity Event Detected", "Attendance Event Recorded"];
const severities: AlertItem["severity"][] = ["info", "low", "medium", "high", "critical"];

export const mockAlerts: AlertItem[] = Array.from({ length: 20 }).map((_, i) => {
  const cam = mockCameras[i % mockCameras.length];
  return {
    id: `alert_${i + 1}`,
    type: alertTypes[i % alertTypes.length],
    severity: severities[i % severities.length],
    storeName: cam.storeName,
    cameraName: cam.name,
    timestamp: `2026-09-${String((i % 20) + 1).padStart(2, "0")} ${String(8 + (i % 12)).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}`,
    status: i % 3 === 0 ? "resolved" : i % 2 === 0 ? "read" : "unread",
    message: `${alertTypes[i % alertTypes.length]} at ${cam.name}, ${cam.storeName}.`,
  };
});

export const mockDashboardStats: DashboardStats = {
  totalEmployees: mockEmployees.length,
  activeEmployees: mockEmployees.filter((e) => e.status === "active").length,
  totalStores: mockStores.length,
  onlineCameras: mockCameras.filter((c) => c.status === "online").length,
  offlineCameras: mockCameras.filter((c) => c.status === "offline").length,
  todayAttendance: mockAttendance.filter((a) => a.status === "present" || a.status === "late").length,
};

export const mockReports: ReportDefinition[] = [
  { id: "r1", title: "Employee Activity Report", type: "employee_activity", description: "Summary of monitored activity events across all stores." },
  { id: "r2", title: "Attendance Report", type: "attendance", description: "Check-in/out records, working hours, and absentee summary." },
  { id: "r3", title: "Store Report", type: "store", description: "Per-store employee and camera distribution." },
  { id: "r4", title: "CCTV Status Report", type: "cctv_status", description: "Camera uptime, offline incidents, and health overview." },
  { id: "r5", title: "Alert Report", type: "alerts", description: "Security and system alerts by severity and status." },
];

export const weeklyAttendanceTrend = [
  { day: "Mon", present: 142, absent: 12 },
  { day: "Tue", present: 138, absent: 16 },
  { day: "Wed", present: 150, absent: 8 },
  { day: "Thu", present: 145, absent: 11 },
  { day: "Fri", present: 149, absent: 9 },
  { day: "Sat", present: 120, absent: 22 },
  { day: "Sun", present: 60, absent: 40 },
];

export const storeDistribution = mockStores.map((s) => ({ name: s.name, employees: s.employeeCount }));

export const activityTypeDistribution = [
  { name: "Entry", value: 34 },
  { name: "Exit", value: 30 },
  { name: "Zone Event", value: 18 },
  { name: "Activity Detected", value: 12 },
  { name: "Review Required", value: 6 },
];

export const cameraStatusDistribution = [
  { name: "Online", value: mockCameras.filter((c) => c.status === "online").length },
  { name: "Offline", value: mockCameras.filter((c) => c.status === "offline").length },
  { name: "Connecting", value: mockCameras.filter((c) => c.status === "connecting").length },
  { name: "Error", value: mockCameras.filter((c) => c.status === "error").length },
];
