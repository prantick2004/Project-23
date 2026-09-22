"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, UserCircle2, Info, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { demoLogin } from "@/features/auth/auth-service";

type Tab = "admin" | "employee";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("admin");

  return (
    <main className="flex min-h-screen bg-hero-gradient bg-grid-glow">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-5 py-14 lg:flex-row lg:gap-20">
        <div className="mb-10 max-w-md text-center lg:mb-0 lg:text-left">
          <button
            onClick={() => router.push("/")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Link href="/"><Logo mono className="justify-center lg:justify-start" /></Link>
          <h1 className="mt-8 text-3xl font-bold text-white">Welcome back to nit Solution</h1>
          <p className="mt-3 text-white/60">
            Sign in to access CCTV monitoring, attendance, and workforce management tools.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            <Info className="h-4 w-4 shrink-0" />
            Frontend demo only — login here does not authenticate against a real server.
          </div>
        </div>

        <div className="w-full max-w-md glass rounded-xl2 p-7 shadow-glow">
          <div className="mb-6 flex rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setTab("admin")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "admin" ? "bg-gradient-to-r from-cyan to-violet text-midnight" : "text-white/60"
              }`}
            >
              <ShieldCheck className="h-4 w-4" /> Admin Login
            </button>
            <button
              onClick={() => setTab("employee")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === "employee" ? "bg-gradient-to-r from-cyan to-violet text-midnight" : "text-white/60"
              }`}
            >
              <UserCircle2 className="h-4 w-4" /> Employee
            </button>
          </div>

          {tab === "admin" ? <AdminLoginForm onSuccess={() => router.push("/admin/dashboard")} /> : <EmployeeAuth onSuccess={() => router.push("/employee/dashboard")} />}
        </div>
      </div>
    </main>
  );
}

function Field({
  label, type = "text", value, onChange, error, autoComplete,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white/70">{label}</label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan/60"
      />
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!employeeId.trim()) e.employeeId = "Employee ID is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      demoLogin("admin", username || "Admin User", employeeId);
      setLoading(false);
      onSuccess();
    }, 800);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Username" value={username} onChange={setUsername} error={errors.username} autoComplete="username" />
      <Field label="Employee ID" value={employeeId} onChange={setEmployeeId} error={errors.employeeId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-white/70">Password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-cyan/60"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-white/60">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} className="accent-cyan" />
          Remember me
        </label>
        <button type="button" className="text-cyan hover:underline">Forgot password?</button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In as Admin"}
      </Button>
      <p className="text-center text-[11px] text-white/40">
        Demo tip: any non-empty values work — this simulates login using local mock state only.
      </p>
    </form>
  );
}

function EmployeeAuth({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div>
      <div className="mb-5 flex justify-center gap-6 text-sm">
        <button onClick={() => setMode("login")} className={mode === "login" ? "font-semibold text-white" : "text-white/50"}>
          Login
        </button>
        <button onClick={() => setMode("register")} className={mode === "register" ? "font-semibold text-white" : "text-white/50"}>
          Register
        </button>
      </div>
      {mode === "login" ? <EmployeeLoginForm onSuccess={onSuccess} /> : <EmployeeRegisterForm onDone={() => setMode("login")} />}
    </div>
  );
}

function EmployeeLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!employeeId.trim()) e.employeeId = "Employee ID is required";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      demoLogin("employee", "Demo Employee", employeeId);
      setLoading(false);
      onSuccess();
    }, 800);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Employee ID" value={employeeId} onChange={setEmployeeId} error={errors.employeeId} />
      <div>
        <label className="mb-1 block text-xs font-medium text-white/70">Password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-cyan/60"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}

const usedEmployeeIds = ["EMP-1000", "EMP-1001", "EMP-1002"]; // mock uniqueness check

function EmployeeRegisterForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", mobile: "", employeeId: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!/^\+?[0-9\s-]{7,15}$/.test(form.mobile)) e.mobile = "Enter a valid mobile number";
    if (!form.employeeId.trim()) e.employeeId = "Employee ID is required";
    else if (usedEmployeeIds.includes(form.employeeId.trim().toUpperCase())) e.employeeId = "This Employee ID is already registered (demo)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  }

  if (success) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-semibold text-emerald-400">Registration captured (demo)</p>
        <p className="mt-1 text-xs text-white/50">No account was created on a real server.</p>
        <Button className="mt-5" variant="outline" onClick={onDone}>Back to Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} error={errors.firstName} />
        <Field label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} error={errors.lastName} />
      </div>
      <Field label="Email ID" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} />
      <Field label="Mobile Number" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} error={errors.mobile} />
      <Field label="Employee ID" value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} error={errors.employeeId} />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Register"}
      </Button>
    </form>
  );
}
