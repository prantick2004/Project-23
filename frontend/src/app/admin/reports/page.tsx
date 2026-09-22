"use client";
import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Download, FileBarChart } from "lucide-react";
import { mockReports } from "@/lib/mock-data/operations";
import { mockStores } from "@/lib/mock-data/stores";
import {
  AttendanceTrendChart, StoreDistributionChart, CameraStatusPie,
} from "@/components/charts/DashboardCharts";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
} from "recharts";
import { activityTypeDistribution } from "@/lib/mock-data/operations";

const COLORS = ["#00D4FF", "#7868FF", "#34D399", "#F59E0B", "#F43F5E"];

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState(mockReports[0].id);
  const [store, setStore] = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-09-01");
  const [dateTo, setDateTo] = useState("2026-09-21");
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const selected = mockReports.find((r) => r.id === reportType)!;

  function handleGenerate() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 800);
  }

  return (
    <AdminShell title="Reports & Analytics">
      <DemoBanner text="Reports and exports below operate on demo data only — not production records." />

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">Generate a Report</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <select value={reportType} onChange={(e) => { setReportType(e.target.value); setGenerated(false); }} className="rounded-lg border border-black/10 px-3 py-2.5 text-sm">
            {mockReports.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <select value={store} onChange={(e) => setStore(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2.5 text-sm">
            <option value="all">All Stores</option>
            {mockStores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleGenerate} disabled={loading}>{loading ? "Generating…" : "Generate Report"}</Button>
          {generated && (
            <>
              <Button variant="outline" size="sm" onClick={() => alert("Demo export — CSV generation simulated, no file created from production data.")}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => alert("Demo export — PDF generation simulated, no file created from production data.")}>
                <Download className="h-4 w-4" /> Export PDF
              </Button>
            </>
          )}
        </div>
      </Card>

      {generated && (
        <>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileBarChart className="h-4 w-4 text-cyan" />
              <h3 className="text-sm font-semibold text-ink">{selected.title} Preview</h3>
              <Badge tone="neutral">Demo Report</Badge>
            </div>
            <p className="text-sm text-muted">{selected.description}</p>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-ink">Attendance Trend</h3>
              <AttendanceTrendChart />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-ink">Store Distribution</h3>
              <StoreDistributionChart />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-ink">Camera Status</h3>
              <CameraStatusPie />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-ink">Activity Type Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={activityTypeDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {activityTypeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </AdminShell>
  );
}
