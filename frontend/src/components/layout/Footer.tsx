import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-midnight px-5 py-14 text-white/60 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
        <div>
          <Logo mono />
          <p className="mt-4 max-w-xs text-sm">
            Smart CCTV monitoring and workforce management for multi-store businesses.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/features" className="hover:text-white">Features</Link></li>
            <li><Link href="/reports" className="hover:text-white">Reports</Link></li>
            <li><Link href="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs">
        © 2026 nit Solution. Demo frontend build — not connected to production systems.
      </div>
    </footer>
  );
}
