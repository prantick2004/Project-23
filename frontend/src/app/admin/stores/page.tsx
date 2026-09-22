import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { StoreTable } from "@/components/tables/StoreTable";

export default function AdminStoresPage() {
  return (
    <AdminShell title="Store Management">
      <DemoBanner />
      <StoreTable />
    </AdminShell>
  );
}
