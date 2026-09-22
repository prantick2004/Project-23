"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { mockCameras } from "@/lib/mock-data/cameras";
import { mockStores } from "@/lib/mock-data/stores";
import { CameraCard } from "@/components/cameras/CameraCard";

export function CameraGrid() {
  const [search, setSearch] = useState("");
  const [store, setStore] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return mockCameras.filter((c) => {
      const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.cameraId.toLowerCase().includes(search.toLowerCase());
      const matchesStore = store === "all" || c.storeId === store;
      const matchesStatus = status === "all" || c.status === status;
      return matchesSearch && matchesStore && matchesStatus;
    });
  }, [search, store, status]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search camera…" className="w-48 bg-transparent text-sm outline-none placeholder-muted" />
        </div>
        <select value={store} onChange={(e) => setStore(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="all">All Stores</option>
          {mockStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="connecting">Connecting</option>
          <option value="error">Error</option>
        </select>
        <span className="ml-auto text-xs text-muted">{filtered.length} cameras</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c) => <CameraCard key={c.id} camera={c} />)}
      </div>
    </div>
  );
}
