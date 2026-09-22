"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LayoutDashboard, User, CalendarCheck, Activity, LogOut, ArrowLeft } from "lucide-react";
import { demoLogout } from "@/features/auth/auth-service";

const items = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/employee/profile", icon: User },
  { label: "Attendance", href: "/employee/attendance", icon: CalendarCheck },
  { label: "Activities", href: "/employee/activities", icon: Activity },
];

export function EmployeeTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-ink"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Link href="/employee/dashboard"><Logo /></Link>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-surface text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => { demoLogout(); router.push("/login"); }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </header>
  );
}
