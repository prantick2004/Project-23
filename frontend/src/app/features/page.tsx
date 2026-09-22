import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Camera, Users, Store, CalendarCheck, Activity, Bell, FileBarChart, LayoutDashboard } from "lucide-react";

const features = [
  { icon: Users, title: "Employee Management", desc: "Register employees, upload photos, generate face datasets, and manage profiles." },
  { icon: Camera, title: "Face Recognition", desc: "Real-time recognition across cameras with confidence scoring for check-ins." },
  { icon: CalendarCheck, title: "Attendance Automation", desc: "Automatic check-in/check-out and working-hour calculation — no manual entry." },
  { icon: Activity, title: "Activity Detection", desc: "AI-based detection of phone usage, inactivity, restricted-area entry, and more." },
  { icon: Store, title: "Multi-Store Management", desc: "Centralized control of employees and cameras across every business location." },
  { icon: Bell, title: "Alerts & Notifications", desc: "Real-time alerts for security and operational events, with severity levels." },
  { icon: FileBarChart, title: "Reports & Analytics", desc: "Exportable attendance, activity, and security reports with rich visualizations." },
  { icon: LayoutDashboard, title: "Unified Dashboard", desc: "Live stats for cameras, attendance, and alerts — all in a single view." },
];

export default function FeaturesPage() {
  return (
    <main className="bg-midnight">
      <PublicNavbar />
      <section className="bg-hero-gradient bg-grid-glow px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Platform Features</h1>
          <p className="mt-6 text-white/70">Everything needed to run a secure, well-managed, multi-location workforce.</p>
        </div>
      </section>
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-xl2 p-6 transition-transform hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-cyan/20 to-violet/20">
                <f.icon className="h-5 w-5 text-cyan" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
