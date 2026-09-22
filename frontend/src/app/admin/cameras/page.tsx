import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { CameraGrid } from "@/components/cameras/CameraGrid";

export default function AdminCamerasPage() {
  return (
    <AdminShell title="CCTV Monitoring">
      <DemoBanner text="No live streams are connected. All previews are static demo placeholders." />
      <CameraGrid />
    </AdminShell>
  );
}
