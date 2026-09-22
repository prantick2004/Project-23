import { EmployeeTopbar } from "@/components/navigation/EmployeeTopbar";

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <EmployeeTopbar />
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">{children}</main>
    </div>
  );
}
