"use client";
import { useMemo, useState } from "react";
import { Search, Plus, ChevronUp, ChevronDown, Pencil, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockEmployees } from "@/lib/mock-data/employees";
import { Employee } from "@/types";
import { EmployeeFormModal } from "@/components/forms/EmployeeFormModal";

const PAGE_SIZE = 8;
type SortKey = "employeeId" | "firstName" | "storeName" | "status";

const statusTone: Record<Employee["status"], "success" | "neutral" | "warning" | "danger"> = {
  active: "success",
  inactive: "neutral",
  suspended: "warning",
  terminated: "danger",
};

export function EmployeeTable() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("employeeId");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    let rows = employees.filter((e) => {
      const matchesSearch =
        !search ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    rows = [...rows].sort((a, b) => {
      const av = sortKey === "firstName" ? a.firstName : (a as any)[sortKey];
      const bv = sortKey === "firstName" ? b.firstName : (b as any)[sortKey];
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [employees, search, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  function handleSave(emp: Employee) {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === emp.id);
      return exists ? prev.map((e) => (e.id === emp.id ? emp : e)) : [emp, ...prev];
    });
    setModalOpen(false);
    setEditing(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, ID, email…"
              className="w-52 bg-transparent text-sm outline-none placeholder-muted"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ink"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-black/5 bg-white shadow-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-black/5 bg-surface text-xs font-semibold uppercase text-muted">
            <tr>
              {[
                { key: "employeeId", label: "Employee ID" },
                { key: "firstName", label: "Name" },
              ].map((c) => (
                <th key={c.key} className="cursor-pointer select-none px-4 py-3" onClick={() => toggleSort(c.key as SortKey)}>
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sortKey === c.key && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("storeName")}>Store</th>
              <th className="px-4 py-3">Department</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("status")}>Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((e) => (
              <tr key={e.id} className="border-b border-black/5 last:border-0 hover:bg-surface/60">
                <td className="px-4 py-3 font-medium text-ink">{e.employeeId}</td>
                <td className="px-4 py-3 text-ink">{e.firstName} {e.lastName}</td>
                <td className="px-4 py-3 text-muted">{e.email}</td>
                <td className="px-4 py-3 text-muted">{e.mobile}</td>
                <td className="px-4 py-3 text-muted">{e.storeName}</td>
                <td className="px-4 py-3 text-muted">{e.department}</td>
                <td className="px-4 py-3"><Badge tone={statusTone[e.status]}>{e.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="rounded-md p-1.5 hover:bg-surface" title="View">
                      <Eye className="h-4 w-4 text-muted" />
                    </button>
                    <button
                      className="rounded-md p-1.5 hover:bg-surface"
                      title="Edit"
                      onClick={() => { setEditing(e); setModalOpen(true); }}
                    >
                      <Pencil className="h-4 w-4 text-muted" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">No employees match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>Page {page} of {totalPages} · {filtered.length} employees</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-md border border-black/10 bg-white p-1.5 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-md border border-black/10 bg-white p-1.5 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {modalOpen && (
        <EmployeeFormModal
          employee={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
