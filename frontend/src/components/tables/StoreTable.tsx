"use client";
import { useMemo, useState } from "react";
import { Search, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockStores } from "@/lib/mock-data/stores";
import { Store } from "@/types";

export function StoreTable() {
  const [stores, setStores] = useState<Store[]>(mockStores);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const filtered = useMemo(
    () => stores.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.storeId.toLowerCase().includes(search.toLowerCase())),
    [stores, search]
  );

  function handleSave(store: Store) {
    setStores((prev) => (prev.some((s) => s.id === store.id) ? prev.map((s) => (s.id === store.id ? store : s)) : [store, ...prev]));
    setModalOpen(false);
    setEditing(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stores…" className="w-52 bg-transparent text-sm outline-none placeholder-muted" />
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Store</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-xl2 border border-black/5 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{s.name}</p>
                <p className="text-[11px] text-muted">{s.storeId}</p>
              </div>
              <Badge tone={s.status === "active" ? "success" : "neutral"}>{s.status}</Badge>
            </div>
            <p className="mt-3 text-xs text-muted">{s.address}</p>
            <p className="mt-2 text-xs text-ink">Manager: <span className="font-medium">{s.managerName}</span></p>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-xs text-muted">
              <span>{s.employeeCount} employees</span>
              <span>{s.cameraCount} cameras</span>
              <button onClick={() => { setEditing(s); setModalOpen(true); }} className="rounded-md p-1 hover:bg-surface">
                <Pencil className="h-3.5 w-3.5 text-muted" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <StoreFormModal store={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}
    </div>
  );
}

function StoreFormModal({ store, onClose, onSave }: { store: Store | null; onClose: () => void; onSave: (s: Store) => void }) {
  const [form, setForm] = useState<Partial<Store>>(
    store ?? { storeId: `STR-${Math.floor(100 + Math.random() * 899)}`, name: "", address: "", managerName: "", employeeCount: 0, cameraCount: 0, status: "active" }
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-card">
        <h3 className="mb-4 text-base font-semibold text-ink">{store ? "Edit Store" : "Add Store"}</h3>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ id: store?.id ?? `st_${Date.now()}`, ...form } as Store);
          }}
        >
          {[
            { key: "name", label: "Store Name" },
            { key: "address", label: "Address" },
            { key: "managerName", label: "Manager" },
          ].map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-medium text-muted">{f.label}</label>
              <input
                value={(form as any)[f.key] || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-cyan"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{store ? "Save Changes" : "Add Store"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
