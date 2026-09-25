"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { publicNav } from "@/lib/constants/nav";
import { cn } from "@/lib/utils/cn";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Spacer preserves document flow height so no page needs edits */}
      <div className="h-24" aria-hidden="true" />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-6 z-50 flex justify-center px-4"
      >
        <header className="relative w-full max-w-5xl">
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-full border px-4 py-2.5 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 sm:px-5",
              scrolled
                ? "border-white/15 bg-midnight/75 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                : "border-white/10 bg-midnight/40 shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
            )}
          >
            {/* LEFT — brand */}
            <Link
              href="/"
              aria-label="nit Solution — Home"
              className="group shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
            >
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
                transition={{ duration: 0.2 }}
                className="flex items-center transition-[filter] duration-200 group-hover:drop-shadow-[0_0_14px_rgba(0,212,255,0.35)]"
              >
                <Logo mono />
              </motion.div>
            </Link>

            {/* CENTER — nav links */}
            <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
              {publicNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-[13.5px] font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60",
                      isActive
                        ? "text-white"
                        : "text-white/60 hover:-translate-y-0.5 hover:text-white/90"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="public-nav-active-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-cyan/15 to-violet/15 shadow-[0_0_18px_rgba(0,212,255,0.22)] ring-1 ring-white/10"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 380, damping: 30 }
                        }
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT — login + mobile trigger */}
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/login" className="group hidden lg:block">
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5 pl-4 pr-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                >
                  Login
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="public-mobile-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="rounded-full p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 lg:hidden"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          <AnimatePresence>
            {open && (
              <motion.div
                id="public-mobile-menu"
                initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-2 right-2 top-[calc(100%+10px)] rounded-3xl border border-white/10 bg-midnight/85 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:hidden"
              >
                <div className="flex flex-col gap-1">
                  {publicNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60",
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link href="/login" onClick={() => setOpen(false)} className="mt-1">
                    <Button className="w-full justify-center gap-1.5">
                      Login
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </motion.div>
    </>
  );
}
