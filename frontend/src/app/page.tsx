import { HomeHeroSection } from "@/components/marketing/HomeHeroSection";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main className="bg-black p-3 sm:p-4">
      <HomeHeroSection />
      <Footer />
    </main>
  );
}
