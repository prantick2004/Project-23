import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockAttendance } from "@/lib/mock-data/operations";
import { AttendanceTrendChart } from "@/components/charts/DashboardCharts";

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  present: "success", late: "warning", absent: "danger", half_day: "info", on_leave: "neutral",
};

export default function EmployeeAttendancePage() {
  const rows = mockAttendance.slice(0, 15);
  return (
    <EmployeeShell>
      <DemoBanner text="Personal attendance history shown is sample demo data." />

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">My Attendance Trend</h3>
        <AttendanceTrendChart />
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">Attendance History</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-muted">{a.date}</td>
                  <td className="px-4 py-3 text-muted">{a.checkIn ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{a.checkOut ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{a.durationHours ? `${a.durationHours}h` : "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone[a.status]}>{a.status.replace("_", " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </EmployeeShell>
  );
}
