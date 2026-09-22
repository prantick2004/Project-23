import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { CalendarCheck, Clock, Activity as ActivityIcon, TrendingUp } from "lucide-react";
import { mockEmployees } from "@/lib/mock-data/employees";
import { mockAttendance, mockActivities } from "@/lib/mock-data/operations";

export default function EmployeeDashboardPage() {
  const me = mockEmployees[0];
  const myAttendance = mockAttendance.filter((a) => a.employeeId === me.employeeId).slice(0, 6);
  const myActivity = mockActivities.filter((a) => a.employeeName === `${me.firstName} ${me.lastName}`).slice(0, 5);
  const presentDays = mockAttendance.filter((a) => a.employeeId === me.employeeId && a.status === "present").length || 18;

  return (
    <EmployeeShell>
      <DemoBanner text={`Signed in as demo profile: ${me.firstName} ${me.lastName}. Data shown is sample-only.`} />

      <div>
        <h1 className="text-xl font-bold text-ink">Welcome back, {me.firstName} 👋</h1>
        <p className="text-sm text-muted">Here&apos;s your demo activity summary for this month.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present Days" value={presentDays} icon={CalendarCheck} tone="emerald" />
        <StatCard label="Avg. Check-In" value="09:12 AM" icon={Clock} tone="cyan" />
        <StatCard label="Activity Events" value={myActivity.length || 4} icon={ActivityIcon} tone="violet" />
        <StatCard label="Attendance Rate" value="94%" icon={TrendingUp} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-ink">Recent Attendance</h3>
          <div className="space-y-3">
            {(myAttendance.length ? myAttendance : mockAttendance.slice(0, 6)).map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-black/5 pb-2.5 last:border-0">
                <span className="text-xs text-muted">{a.date}</span>
                <span className="text-xs text-ink">{a.checkIn ?? "—"} – {a.checkOut ?? "—"}</span>
                <Badge tone={a.status === "present" ? "success" : a.status === "late" ? "warning" : "danger"}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-ink">My Recent Activity</h3>
          <div className="space-y-3">
            {(myActivity.length ? myActivity : mockActivities.slice(0, 5)).map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-black/5 pb-2.5 last:border-0">
                <div>
                  <p className="text-xs font-medium text-ink">{a.type.replace(/_/g, " ")}</p>
                  <p className="text-[11px] text-muted">{a.cameraName} · {a.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </EmployeeShell>
  );
}
