import { AdminShell } from "@/components/layout/AdminShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { AttendanceTrendChart, StoreDistributionChart, CameraStatusPie } from "@/components/charts/DashboardCharts";
import { Users, UserCheck, Store, Camera, CameraOff, CalendarCheck } from "lucide-react";
import { mockDashboardStats, mockActivities, mockAlerts } from "@/lib/mock-data/operations";

export default function AdminDashboardPage() {
  const stats = mockDashboardStats;
  const recentActivity = mockActivities.slice(0, 6);
  const recentAlerts = mockAlerts.slice(0, 5);

  return (
    <AdminShell title="Dashboard">
      <DemoBanner text="All statistics and records below are sample demo data for frontend preview." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} tone="cyan" />
        <StatCard label="Active Employees" value={stats.activeEmployees} icon={UserCheck} tone="emerald" />
        <StatCard label="Total Stores" value={stats.totalStores} icon={Store} tone="violet" />
        <StatCard label="Online Cameras" value={stats.onlineCameras} icon={Camera} tone="cyan" />
        <StatCard label="Offline Cameras" value={stats.offlineCameras} icon={CameraOff} tone="rose" />
        <StatCard label="Today's Attendance" value={stats.todayAttendance} icon={CalendarCheck} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-ink">Weekly Attendance Trend</h3>
          <AttendanceTrendChart />
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-ink">Camera Status</h3>
          <CameraStatusPie />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-ink">Employees per Store</h3>
          <StoreDistributionChart />
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-ink">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-black/5 pb-2.5 last:border-0">
                <div>
                  <p className="text-xs font-medium text-ink">{a.employeeName ?? "Unknown"}</p>
                  <p className="text-[11px] text-muted">{a.cameraName} · {a.timestamp}</p>
                </div>
                <Badge tone={a.status === "review_required" ? "warning" : a.status === "reviewed" ? "success" : "info"}>
                  {a.type.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-ink">Recent Alerts</h3>
          <div className="space-y-3">
            {recentAlerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-black/5 pb-2.5 last:border-0">
                <div>
                  <p className="text-xs font-medium text-ink">{a.type}</p>
                  <p className="text-[11px] text-muted">{a.storeName} · {a.timestamp}</p>
                </div>
                <Badge tone={a.severity === "critical" || a.severity === "high" ? "danger" : a.severity === "medium" ? "warning" : "neutral"}>
                  {a.severity}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
