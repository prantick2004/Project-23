"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const navLinks = [
  { label: "ABOUT", href: "/about" },
  { label: "CONTACT", href: "/contact" },
  { label: "FAQ", href: "/contact" },
];

export function HomeHeroSection() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[28px] bg-midnight ring-1 ring-white/10 sm:min-h-[calc(100vh-2rem)] sm:rounded-[32px]">
      {/* Atmospheric background — violet left, pink/magenta right, slow CSS drift */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="ambient-blob"
          style={{
            top: "-10%",
            left: "-6%",
            width: "60vw",
            height: "60vw",
            maxWidth: 640,
            maxHeight: 640,
            background:
              "radial-gradient(circle at 50% 50%, rgba(109,93,251,0.55) 0%, rgba(109,93,251,0) 70%)",
            animation: "ambientDriftA 42s ease-in-out infinite",
          }}
        />
        <div
          className="ambient-blob"
          style={{
            top: "-16%",
            right: "-14%",
            width: "56vw",
            height: "56vw",
            maxWidth: 600,
            maxHeight: 600,
            background:
              "radial-gradient(circle at 50% 50%, rgba(217,70,239,0.45) 0%, rgba(217,70,239,0) 70%)",
            animation: "ambientDriftB 50s ease-in-out infinite",
          }}
        />
        <div
          className="ambient-blob"
          style={{
            bottom: "-20%",
            left: "20%",
            width: "44vw",
            height: "44vw",
            maxWidth: 500,
            maxHeight: 500,
            background:
              "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0) 70%)",
            animation: "ambientDriftC 55s ease-in-out infinite",
          }}
        />
        <div className="ambient-grain absolute inset-0 opacity-[0.035] mix-blend-overlay" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 40%, transparent 50%, rgba(0,0,0,0.5) 100%)",
          }}
        />
      </div>

      {/* Header row — logo + search left, nav right */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" aria-label="nit Solution — Home">
            <Logo mono />
          </Link>
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              placeholder="What are you looking for?"
              disabled
              className="w-52 cursor-default rounded-full border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-xs text-white/70 placeholder-white/35 outline-none lg:w-64"
            />
          </div>
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-medium tracking-wider text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-white/10"
          >
            Login
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="home-mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="home-mobile-menu"
          className="relative z-10 mx-5 mb-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-xl md:hidden"
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="mt-1 rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-medium text-white"
          >
            Login
          </Link>
        </div>
      )}

      {/* Centered hero content */}
      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-6 text-center sm:min-h-[65vh]">
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extralight tracking-[0.15em] text-white sm:text-5xl lg:text-6xl"
        >
          WELCOME TO
          <br />
          <span className="font-light">NIT SOLUTION</span>
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-md text-sm leading-relaxed text-white/50"
        >
          Smart surveillance, employee monitoring, and multi-store management
          in one secure platform.
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link
            href="/features"
            className="mt-9 inline-block rounded-full border border-white/25 px-7 py-2.5 text-xs font-medium tracking-widest text-white transition-colors hover:bg-white/10"
          >
            LEARN MORE
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
