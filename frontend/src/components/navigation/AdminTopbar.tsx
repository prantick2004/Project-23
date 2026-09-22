"use client";
import { Search, Bell, ChevronDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTopbar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-ink"
          title="Go back"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-black/10 bg-surface px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-muted" />
          <input
            placeholder="Search…"
            className="w-48 bg-transparent text-sm text-ink outline-none placeholder-muted"
          />
        </div>

        <button className="relative rounded-lg p-2 hover:bg-surface" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-violet text-xs font-bold text-white">
              AD
            </div>
            <span className="hidden text-sm font-medium text-ink sm:inline">Admin User</span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
          {open && (
            <div className="absolute right-0 top-11 w-44 rounded-lg border border-black/5 bg-white py-1 shadow-card">
              <a href="/admin/settings" className="block px-4 py-2 text-sm text-ink hover:bg-surface">Settings</a>
              <a href="/login" className="block px-4 py-2 text-sm text-rose-600 hover:bg-surface">Logout</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
