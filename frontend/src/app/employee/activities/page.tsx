import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockActivities } from "@/lib/mock-data/operations";

export default function EmployeeActivitiesPage() {
  const rows = mockActivities.slice(0, 15);
  return (
    <EmployeeShell>
      <DemoBanner text="Personal activity log shown is sample demo data, not real detection output." />

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">My Activity Log</h3>
        <div className="space-y-3">
          {rows.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium text-ink">{a.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted">{a.cameraName} · {a.storeName} · {a.timestamp}</p>
              </div>
              <Badge tone={a.status === "review_required" ? "warning" : a.status === "reviewed" ? "success" : "info"}>{a.status.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </EmployeeShell>
  );
}
