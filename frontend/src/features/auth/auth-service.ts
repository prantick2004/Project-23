// Future integration: app/api/routers/v1/auth.py
// DEMO ONLY — this is not real authentication. No credentials are validated against a server,
// nothing is hashed, and no session is secure. Replace entirely when connecting the backend.
import { UserRole } from "@/types";

export interface DemoSession {
  role: UserRole;
  name: string;
  employeeId?: string;
}

const DEMO_KEY = "nit_demo_session";

export function demoLogin(role: UserRole, name: string, employeeId?: string): DemoSession {
  const session: DemoSession = { role, name, employeeId };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(session));
  }
  return session;
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function demoLogout() {
  if (typeof window !== "undefined") window.localStorage.removeItem(DEMO_KEY);
}
