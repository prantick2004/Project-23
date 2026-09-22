"use client";
import { useState } from "react";
import { EmployeeShell } from "@/components/layout/EmployeeShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockEmployees } from "@/lib/mock-data/employees";

export default function EmployeeProfilePage() {
  const me = mockEmployees[0];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ email: me.email, mobile: me.mobile });
  const [saved, setSaved] = useState(false);

  return (
    <EmployeeShell>
      <DemoBanner text="Profile changes are saved to local state only for this demo." />

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-violet text-lg font-bold text-white">
            {me.firstName[0]}{me.lastName[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">{me.firstName} {me.lastName}</h2>
            <p className="text-sm text-muted">{me.position} · {me.department}</p>
            <Badge tone="success">{me.status}</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Employee ID" value={me.employeeId} readOnly />
          <Field label="Assigned Store" value={me.storeName} readOnly />
          <Field
            label="Email"
            value={form.email}
            readOnly={!editing}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Field
            label="Mobile Number"
            value={form.mobile}
            readOnly={!editing}
            onChange={(v) => setForm({ ...form, mobile: v })}
          />
        </div>

        <div className="mt-6 flex gap-3">
          {editing ? (
            <>
              <Button onClick={() => { setEditing(false); setSaved(true); }}>Save Changes</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => { setEditing(true); setSaved(false); }}>Edit Contact Info</Button>
          )}
          {saved && <span className="self-center text-xs font-medium text-emerald-600">Saved locally (demo) ✓</span>}
        </div>
      </Card>
    </EmployeeShell>
  );
}

function Field({ label, value, readOnly, onChange }: { label: string; value: string; readOnly?: boolean; onChange?: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm ${readOnly ? "border-black/5 bg-surface text-muted" : "border-black/10 text-ink outline-none focus:border-cyan"}`}
      />
    </div>
  );
}
