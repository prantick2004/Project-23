"use client";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Search } from "lucide-react";
import { mockActivities } from "@/lib/mock-data/operations";
import { mockStores } from "@/lib/mock-data/stores";
import { ActivityEvent } from "@/types";

const typeLabel: Record<ActivityEvent["type"], string> = {
  entry_event: "Entry Event", exit_event: "Exit Event", zone_event: "Zone Event",
  activity_detected: "Activity Detected", review_required: "Review Required",
};

export default function AdminActivitiesPage() {
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => mockActivities.filter((a) => {
    const s = !search || (a.employeeName ?? "").toLowerCase().includes(search.toLowerCase()) || a.cameraName.toLowerCase().includes(search.toLowerCase());
    const st = store === "all" || a.storeName === store;
    const ty = type === "all" || a.type === type;
    return s && st && ty;
  }), [search, store, type]);

  return (
    <AdminShell title="Activity Monitoring">
      <DemoBanner text="Sample activity events shown for demonstration — not real detection results." />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or camera…" className="w-56 bg-transparent text-sm outline-none placeholder-muted" />
          </div>
          <select value={store} onChange={(e) => setStore(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="all">All Stores</option>
            {mockStores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="all">All Types</option>
            {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Camera</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3 font-medium text-ink">{typeLabel[a.type]}</td>
                  <td className="px-4 py-3 text-muted">{a.employeeName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{a.storeName}</td>
                  <td className="px-4 py-3 text-muted">{a.cameraName}</td>
                  <td className="px-4 py-3 text-muted">{a.timestamp}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.status === "review_required" ? "warning" : a.status === "reviewed" ? "success" : "info"}>
                      {a.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
