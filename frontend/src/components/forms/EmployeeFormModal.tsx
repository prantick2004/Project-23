"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Employee } from "@/types";
import { mockStores } from "@/lib/mock-data/stores";

export function EmployeeFormModal({
  employee, onClose, onSave,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (e: Employee) => void;
}) {
  const [form, setForm] = useState<Partial<Employee>>(
    employee ?? {
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 8999)}`,
      firstName: "", lastName: "", email: "", mobile: "",
      storeId: mockStores[0].id, storeName: mockStores[0].name,
      department: "Operations", position: "Associate", status: "active",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!/^\S+@\S+\.\S+$/.test(form.email || "")) e.email = "Invalid email";
    if (!form.mobile) e.mobile = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({
      id: employee?.id ?? `emp_${Date.now()}`,
      joinedAt: employee?.joinedAt ?? new Date().toISOString().slice(0, 10),
      ...form,
    } as Employee);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">{employee ? "Edit Employee" : "Add Employee"}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted" /></button>
        </div>
        <DemoBanner />
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="First Name" value={form.firstName || ""} onChange={(v) => setForm({ ...form, firstName: v })} error={errors.firstName} />
            <TextInput label="Last Name" value={form.lastName || ""} onChange={(v) => setForm({ ...form, lastName: v })} error={errors.lastName} />
          </div>
          <TextInput label="Email" value={form.email || ""} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} />
          <TextInput label="Mobile" value={form.mobile || ""} onChange={(v) => setForm({ ...form, mobile: v })} error={errors.mobile} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Store</label>
              <select
                value={form.storeId}
                onChange={(e) => {
                  const s = mockStores.find((s) => s.id === e.target.value)!;
                  setForm({ ...form, storeId: s.id, storeName: s.name });
                }}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
              >
                {mockStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Employee["status"] })}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
          <TextInput label="Department" value={form.department || ""} onChange={(v) => setForm({ ...form, department: v })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{employee ? "Save Changes" : "Add Employee"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-cyan"
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
