"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Camera, Store, CalendarCheck, Activity, Bell, FileBarChart, Settings, LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { adminSidebar } from "@/lib/constants/nav";
import { demoLogout } from "@/features/auth/auth-service";

const iconMap: Record<string, any> = {
  LayoutDashboard, Users, Camera, Store, CalendarCheck, Activity, Bell, FileBarChart, Settings,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-midnight">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin/dashboard"><Logo mono /></Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {adminSidebar.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-gradient-to-r from-cyan/20 to-violet/20 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => { demoLogout(); router.push("/login"); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
