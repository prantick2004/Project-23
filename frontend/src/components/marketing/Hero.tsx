"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Camera, ShieldCheck, Store, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient bg-grid-glow pb-24 pt-16 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">
            <ShieldCheck className="h-3.5 w-3.5" /> Enterprise Security Platform
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            Smart Surveillance.{" "}
            <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-transparent">
              Smarter Workforce
            </span>{" "}
            Management.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70">
            Monitor CCTV activity, manage employee information, oversee multiple store locations,
            and access business insights through one centralized security platform.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/features">
              <Button size="lg">Explore Platform</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Admin &amp; Employee Login
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-8 text-white/50">
            <div className="flex items-center gap-2 text-sm"><Camera className="h-4 w-4 text-cyan" /> Multi-camera support</div>
            <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-cyan" /> Workforce insights</div>
            <div className="flex items-center gap-2 text-sm"><Store className="h-4 w-4 text-cyan" /> Multi-store ready</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-cyan/10 blur-3xl" />

          <div className="relative rounded-xl2 glass p-4 shadow-glow">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-medium text-white/60">Live Overview — Demo Preview</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Demo
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {["Main Entrance", "Sales Floor", "Warehouse", "Reception"].map((name, i) => (
                <div
                  key={name}
                  className="animate-float rounded-lg border border-white/10 bg-white/5 p-3"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  <div className="flex h-16 items-center justify-center rounded-md bg-gradient-to-br from-deep-blue to-midnight">
                    <Camera className="h-5 w-5 text-cyan/70" />
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-white/70">{name}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-violet/20 bg-violet/10 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-soft" />
                <span className="text-xs font-medium text-white/80">Today&apos;s Attendance</span>
              </div>
              <span className="text-sm font-bold text-white">92%</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Stores", value: "4" },
                { label: "Cameras", value: "24" },
                { label: "Alerts", value: "3" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/10 bg-white/5 py-2.5 text-center">
                  <p className="text-base font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
