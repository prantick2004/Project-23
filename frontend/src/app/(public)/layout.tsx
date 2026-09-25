import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <AmbientBackground />
      <PublicNavbar />
      {children}
      <Footer />
    </div>
  );
}
