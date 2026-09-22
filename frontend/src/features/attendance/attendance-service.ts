// Future integration: app/api/routers/v1/attendance.py + app/api/websockets/attendance_stream.py
import { mockAttendance } from "@/lib/mock-data/operations";
import { AttendanceRecord } from "@/types";

export async function getAttendance(): Promise<AttendanceRecord[]> {
  return mockAttendance;
}
