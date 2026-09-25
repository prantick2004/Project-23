"use client";
import { motion } from "framer-motion";
import { Camera, Users, Store, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "CCTV Monitoring",
    desc: "Unified live view across USB, IP, RTSP, and CCTV/DVR cameras with real-time status.",
  },
  {
    icon: Users,
    title: "Employee Management",
    desc: "Register, update, and track employees with face datasets and profile management.",
  },
  {
    icon: Store,
    title: "Multi-Store Management",
    desc: "Manage locations, assign staff and cameras, and view store-level insights centrally.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Attendance, activity, and security reports exportable to PDF, Excel, or CSV.",
  },
];

export function PlatformOverview() {
  return (
    <section className="bg-midnight/40 px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">One Platform, Every Store</h2>
          <p className="mt-4 text-white/60">
            Built for real-world office and retail environments — reliable, scalable, and secure.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-xl2 p-6 transition-transform hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-cyan/20 to-violet/20">
                <f.icon className="h-5 w-5 text-cyan" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
