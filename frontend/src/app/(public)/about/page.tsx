import { ShieldCheck, Target, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <main>
      <section className="bg-hero-gradient bg-grid-glow px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">About nit Solution</h1>
          <p className="mt-6 text-white/70">
            nit Solution builds a centralized platform for CCTV-based employee monitoring, attendance
            tracking, and multi-store operations — helping businesses run secure, accountable, and
            data-informed workplaces.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {[
            { icon: Target, title: "Our Mission", desc: "Make workplace security and workforce visibility effortless across any number of store locations." },
            { icon: ShieldCheck, title: "Reliability First", desc: "Built on a clean-architecture backend designed for accuracy, uptime, and future scale." },
            { icon: Users, title: "People-Centered", desc: "Tools for admins and employees alike — transparent, role-appropriate, and easy to use." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl2 p-6">
              <f.icon className="h-6 w-6 text-cyan" />
              <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
