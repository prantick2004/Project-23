"use client";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Search, X, CheckCheck, Eye } from "lucide-react";
import { mockAlerts as seedAlerts } from "@/lib/mock-data/operations";
import { AlertItem } from "@/types";

const severityTone: Record<AlertItem["severity"], "info" | "neutral" | "warning" | "danger"> = {
  info: "info", low: "neutral", medium: "warning", high: "danger", critical: "danger",
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(seedAlerts);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<AlertItem | null>(null);

  const filtered = useMemo(() => alerts.filter((a) => {
    const s = !search || a.type.toLowerCase().includes(search.toLowerCase()) || a.storeName.toLowerCase().includes(search.toLowerCase());
    const sv = severity === "all" || a.severity === severity;
    const st = status === "all" || a.status === status;
    return s && sv && st;
  }), [alerts, search, severity, status]);

  function updateStatus(id: string, next: AlertItem["status"]) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
    setSelected((sel) => (sel && sel.id === id ? { ...sel, status: next } : sel));
  }

  return (
    <AdminShell title="Alerts & Notifications">
      <DemoBanner text="Alerts below are demonstration data. Mark as read/resolved updates local state only." />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts…" className="w-52 bg-transparent text-sm outline-none placeholder-muted" />
          </div>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${a.status === "unread" ? "border-cyan/30 bg-cyan/5" : "border-black/5"}`}
            >
              <button className="flex flex-1 items-center gap-4 text-left" onClick={() => setSelected(a)}>
                <Badge tone={severityTone[a.severity]}>{a.severity}</Badge>
                <div>
                  <p className="text-sm font-medium text-ink">{a.type}</p>
                  <p className="text-[11px] text-muted">{a.storeName}{a.cameraName ? ` · ${a.cameraName}` : ""} · {a.timestamp}</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <Badge tone={a.status === "resolved" ? "success" : a.status === "read" ? "neutral" : "info"}>{a.status}</Badge>
                {a.status !== "read" && a.status !== "resolved" && (
                  <button onClick={() => updateStatus(a.id, "read")} className="rounded-md p-1.5 hover:bg-surface" title="Mark as read">
                    <Eye className="h-4 w-4 text-muted" />
                  </button>
                )}
                {a.status !== "resolved" && (
                  <button onClick={() => updateStatus(a.id, "resolved")} className="rounded-md p-1.5 hover:bg-surface" title="Mark as resolved">
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted">No alerts match your filters.</p>}
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <Badge tone={severityTone[selected.severity]}>{selected.severity}</Badge>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-muted" /></button>
            </div>
            <h3 className="text-base font-semibold text-ink">{selected.type}</h3>
            <p className="mt-2 text-sm text-muted">{selected.message}</p>
            <div className="mt-4 space-y-1 text-xs text-muted">
              <p>Store: <span className="text-ink">{selected.storeName}</span></p>
              {selected.cameraName && <p>Camera: <span className="text-ink">{selected.cameraName}</span></p>}
              <p>Timestamp: <span className="text-ink">{selected.timestamp}</span></p>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
