import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/marketing/Hero";
import { PlatformOverview } from "@/components/marketing/PlatformOverview";
import { CctvPreview } from "@/components/marketing/CctvPreview";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { CtaSection } from "@/components/marketing/CtaSection";

export default function HomePage() {
  return (
    <main className="bg-midnight">
      <PublicNavbar />
      <Hero />
      <StatsStrip />
      <PlatformOverview />
      <CctvPreview />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </main>
  );
}
