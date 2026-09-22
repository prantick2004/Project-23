import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { AdminTopbar } from "@/components/navigation/AdminTopbar";

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminTopbar title={title} />
        <main className="flex-1 space-y-6 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
