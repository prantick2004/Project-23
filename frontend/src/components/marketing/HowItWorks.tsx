"use client";
import { motion } from "framer-motion";

const steps = [
  { n: "01", title: "Register Employees & Stores", desc: "Add employee profiles and set up store locations with assigned cameras." },
  { n: "02", title: "Connect Cameras", desc: "Bring USB, IP, RTSP, or CCTV feeds online per store." },
  { n: "03", title: "Monitor & Track", desc: "Attendance, activity, and alerts flow into one dashboard automatically." },
  { n: "04", title: "Review & Report", desc: "Generate exportable reports for attendance, activity, and security events." },
];

export function HowItWorks() {
  return (
    <section className="bg-midnight px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl2 border border-white/10 p-6"
            >
              <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-3xl font-bold text-transparent">
                {s.n}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-white/60">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
