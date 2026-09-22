import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { EmployeeTable } from "@/components/tables/EmployeeTable";

export default function AdminEmployeesPage() {
  return (
    <AdminShell title="Employee Management">
      <DemoBanner text="Add, edit, and manage employees below. All changes are frontend-only and reset on page reload." />
      <EmployeeTable />
    </AdminShell>
  );
}
