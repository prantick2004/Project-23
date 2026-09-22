"use client";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Search } from "lucide-react";
import { CalendarCheck, UserCheck, UserX, Clock } from "lucide-react";
import { mockAttendance } from "@/lib/mock-data/operations";
import { mockStores } from "@/lib/mock-data/stores";
import { AttendanceRecord } from "@/types";

const statusTone: Record<AttendanceRecord["status"], "success" | "warning" | "danger" | "neutral" | "info"> = {
  present: "success", late: "warning", absent: "danger", half_day: "info", on_leave: "neutral",
};

export default function AdminAttendancePage() {
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => mockAttendance.filter((a) => {
    const s = !search || a.employeeName.toLowerCase().includes(search.toLowerCase()) || a.employeeId.toLowerCase().includes(search.toLowerCase());
    const st = store === "all" || a.storeName === store;
    const sta = status === "all" || a.status === status;
    return s && st && sta;
  }), [search, store, status]);

  const present = mockAttendance.filter((a) => a.status === "present").length;
  const late = mockAttendance.filter((a) => a.status === "late").length;
  const absent = mockAttendance.filter((a) => a.status === "absent").length;

  return (
    <AdminShell title="Attendance">
      <DemoBanner text="Attendance is not being tracked in real time — this is sample historical demo data." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present" value={present} icon={UserCheck} tone="emerald" />
        <StatCard label="Late" value={late} icon={Clock} tone="violet" />
        <StatCard label="Absent" value={absent} icon={UserX} tone="rose" />
        <StatCard label="Total Records" value={mockAttendance.length} icon={CalendarCheck} tone="cyan" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" className="w-48 bg-transparent text-sm outline-none placeholder-muted" />
          </div>
          <select value={store} onChange={(e) => setStore(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="all">All Stores</option>
            {mockStores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half Day</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-ink">{a.employeeName}<span className="block text-[11px] text-muted">{a.employeeId}</span></td>
                  <td className="px-4 py-3 text-muted">{a.storeName}</td>
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
    </AdminShell>
  );
}
