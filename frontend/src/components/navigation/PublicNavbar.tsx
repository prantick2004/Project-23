"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { publicNav } from "@/lib/constants/nav";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-midnight/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
        <Link href="/">
          <Logo mono />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login">
            <Button variant="primary" size="sm">
              Login
            </Button>
          </Link>
        </div>

        <button className="text-white lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-midnight px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/80"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full">Login</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
