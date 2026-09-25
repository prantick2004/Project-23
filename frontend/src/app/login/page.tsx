"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Lock,
  User,
  Hash,
  ArrowRight,
  ArrowUpRight,
  Store,
  Video,
  Zap,
  Layers,
  Apple,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { demoLogin } from "@/features/auth/auth-service";

type Tab = "admin" | "employee";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.11C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28c-.25-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.61H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.39l3.98-3.11z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.98 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

/* Custom bullet CCTV camera graphic — replaces the plain icon badge so the
   floating hero visual reads as an actual camera object, matching the
   reference image's large white/grey CCTV unit. */
function CctvCamera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={className}>
      <defs>
        <linearGradient id="camBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      <rect x="70" y="0" width="8" height="18" rx="2" fill="#475569" />
      <rect x="55" y="14" width="38" height="10" rx="4" fill="#64748B" />
      <rect x="20" y="20" width="110" height="40" rx="18" fill="url(#camBody)" />
      <rect x="8" y="24" width="16" height="32" rx="6" fill="#475569" />
      <circle cx="130" cy="40" r="24" fill="#0B1220" />
      <circle cx="130" cy="40" r="18" fill="#111827" stroke="#00D4FF" strokeWidth="2" opacity="0.9" />
      <circle cx="130" cy="40" r="8" fill="#00D4FF" opacity="0.55" />
    </svg>
  );
}

/* Building silhouette with lit windows, used as the ground layer of the
   cinematic dusk scene on the left panel. */
function CityBuildings() {
  const rows = 8;
  const cols = 6;
  return (
    <svg viewBox="0 0 600 260" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="bldgFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B1220" stopOpacity="0" />
          <stop offset="100%" stopColor="#0B1220" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x="0" y="90" width="80" height="170" fill="#0E1A33" />
      <rect x="90" y="60" width="70" height="200" fill="#0E1A33" />
      <rect x="170" y="110" width="60" height="150" fill="#0E1A33" />
      <rect x="430" y="70" width="80" height="190" fill="#0E1A33" />
      <rect x="520" y="100" width="80" height="160" fill="#0E1A33" />
      <rect x="230" y="30" width="190" height="230" fill="#101C38" />
      {Array.from({ length: rows }).map((_, row) => (
        <g key={row}>
          {Array.from({ length: cols }).map((_, col) => {
            const lit = (row + col) % 3 !== 0;
            return (
              <rect
                key={col}
                x={242 + col * 27}
                y={44 + row * 24}
                width={14}
                height={14}
                fill={lit ? (col % 2 === 0 ? "#FFD59E" : "#7FE9FF") : "#0B1220"}
                opacity={lit ? 0.85 : 0.4}
              />
            );
          })}
        </g>
      ))}
      <rect x="0" y="0" width="600" height="260" fill="url(#bldgFade)" />
    </svg>
  );
}

const stats = [
  { icon: Users, label: "Employees", value: "256+" },
  { icon: Store, label: "Stores", value: "12+" },
  { icon: Video, label: "Cameras", value: "48+" },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("admin");
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-midnight">
      <Link
        href="/"
        className="group absolute right-5 top-5 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
      >
        Back to website
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>

      {/* ============ LEFT 50% — CINEMATIC VISUAL / BRANDING PANEL ============ */}
      {/*
        No real photo asset exists in /public yet, so this scene is built from
        layered CSS gradients + an SVG building silhouette + a custom camera
        graphic. To swap in a real photo later, add it to /public/images/
        (e.g. login-hero.jpg) and place an <Image fill priority
        className="object-cover" /> as the very first child of this <section>,
        then keep the blob-glow + vignette layers on top of it for the same
        readability treatment.
      */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-midnight p-10 lg:flex xl:p-14">
        {/* Dusk sky gradient — navy → indigo → violet → magenta → navy */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #0B1220 0%, #131C3E 16%, #2A2158 34%, #4B2E72 50%, #7A3C7E 66%, #3A1E42 82%, #0B1220 100%)",
          }}
        />

        {/* Ambient color blobs for cinematic richness */}
        <div aria-hidden className="absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-cyan/25 blur-[110px] mix-blend-screen" />
        <div aria-hidden className="absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-violet/30 blur-[110px] mix-blend-screen" />
        <div aria-hidden className="absolute bottom-24 left-1/3 h-[360px] w-[360px] rounded-full bg-[#e0559a]/25 blur-[120px] mix-blend-screen" />
        <div aria-hidden className="absolute bottom-0 right-10 h-[260px] w-[260px] rounded-full bg-[#ff9f5a]/15 blur-[100px] mix-blend-screen" />

        {/* City / building silhouette, lit windows */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[46%]">
          <CityBuildings />
        </div>

        {/* Horizon glow where sky meets rooftops */}
        <div aria-hidden className="absolute inset-x-0 bottom-[40%] h-32 bg-gradient-to-t from-transparent via-[#d9538f]/20 to-transparent blur-2xl" />

        {/* Readability vignettes — kept subtle, only where text sits */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-midnight/70 to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-midnight via-midnight/55 to-transparent" />

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.6))]"
        >
          <Link href="/" className="inline-block">
            <Logo mono />
          </Link>
          <p className="ml-[44px] mt-1 text-xs tracking-wide text-white/60">
            Secure Today · Smarter Tomorrow
          </p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 flex items-start gap-8"
        >
          <div className="relative flex flex-col gap-3">
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-full bg-violet/15 blur-3xl" />
            {stats.map((s) => (
              <div
                key={s.label}
                className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-card-dark ring-1 ring-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan/25 to-violet/25 text-cyan">
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] leading-none text-white/55">{s.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-none text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-10">
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-10 -top-20 rotate-[8deg]"
            >
              <CctvCamera className="h-20 w-36 drop-shadow-[0_0_25px_rgba(0,212,255,0.35)]" />
            </motion.div>

            <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-cyan/20 to-violet/20 blur-2xl" />
            <div className="glass w-72 rounded-2xl p-4 shadow-card-dark ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-white/75">Live Camera</p>
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-gradient-to-br from-deep-blue to-midnight ring-1 ring-white/10"
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative z-10 max-w-md"
        >
          <h1
            className="text-4xl font-bold leading-tight text-white"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.45)" }}
          >
            Smarter Surveillance.
            <br />
            Better{" "}
            <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-transparent">
              Workforce Management.
            </span>
          </h1>
          <p
            className="mt-4 text-sm leading-relaxed text-white/70"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}
          >
            Monitor live CCTV feeds, manage employee information, oversee multiple
            store locations, and access powerful insights through one secure
            platform.
          </p>
          <div className="mt-6 flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan" /> Secure
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-cyan" /> Reliable
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan" /> Scalable
            </span>
          </div>
        </motion.div>
      </section>

      {/* ============ RIGHT 50% — LOGIN PANEL (unchanged) ============ */}
      <section className="relative flex w-full flex-col items-center justify-center bg-midnight bg-grid-glow px-5 py-16 lg:w-1/2">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full max-w-md rounded-3xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-9"
        >
          <div className="mb-7 flex flex-col items-center text-center">
            <Logo mono />
            <p className="mt-1 text-[11px] tracking-wide text-white/40">
              Secure Today · Smarter Tomorrow
            </p>
            <h2 className="mt-5 text-2xl font-bold text-white">Welcome Back</h2>
            <p className="mt-1 text-sm text-white/50">
              Sign in to your account to continue
            </p>
          </div>

          <div className="mb-6 flex rounded-full border border-white/10 bg-white/5 p-1.5">
            <button
              onClick={() => setTab("admin")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === "admin"
                  ? "bg-gradient-to-r from-cyan to-violet text-white shadow-glow"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <User className="h-4 w-4" /> Admin Login
            </button>
            <button
              onClick={() => setTab("employee")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-all duration-200 ${
                tab === "employee"
                  ? "bg-gradient-to-r from-cyan to-violet text-white shadow-glow"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Users className="h-4 w-4" /> Employee Login
            </button>
          </div>

          {tab === "admin" ? (
            <AdminLoginForm onSuccess={() => router.push("/admin/dashboard")} />
          ) : (
            <EmployeeAuth onSuccess={() => router.push("/employee/dashboard")} />
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/40">or continue with</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/85 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              <GoogleIcon /> Continue with Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/85 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              <Apple className="h-4 w-4" /> Continue with Apple
            </button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan/15 bg-cyan/5 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
            <div>
              <p className="text-xs font-semibold text-white">Secure Access</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/50">
                Your data is protected with enterprise-grade security.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/30">
            © 2025 nit Solution. All rights reserved.
          </p>
        </motion.div>
      </section>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  icon: Icon,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-white/70">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-10 pr-3.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)]"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
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
      <Field
        label="Username"
        icon={User}
        placeholder="Enter your username"
        value={username}
        onChange={setUsername}
        error={errors.username}
        autoComplete="username"
      />
      <Field
        label="Employee ID"
        icon={Hash}
        placeholder="Enter your employee ID"
        value={employeeId}
        onChange={setEmployeeId}
        error={errors.employeeId}
      />
      <div>
        <label className="mb-2 block text-xs font-medium text-white/70">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            placeholder="Enter your password"
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-10 pr-11 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)]"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1.5 text-xs text-rose-400">{errors.password}</p>}
      </div>

      <div className="flex items-center justify-between text-xs text-white/60">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={() => setRemember(!remember)}
            className="h-3.5 w-3.5 accent-cyan"
          />
          Remember me
        </label>
        <button type="button" className="font-medium text-cyan hover:underline">
          Forgot password?
        </button>
      </div>

      <Button type="submit" size="lg" className="group w-full justify-center gap-2" disabled={loading}>
        {loading ? "Signing in…" : "Login"}
        {!loading && (
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        )}
      </Button>
      <p className="text-center text-[11px] text-white/35">
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
        <button
          onClick={() => setMode("login")}
          className={mode === "login" ? "font-semibold text-white" : "text-white/50"}
        >
          Login
        </button>
        <button
          onClick={() => setMode("register")}
          className={mode === "register" ? "font-semibold text-white" : "text-white/50"}
        >
          Register
        </button>
      </div>
      {mode === "login" ? (
        <EmployeeLoginForm onSuccess={onSuccess} />
      ) : (
        <EmployeeRegisterForm onDone={() => setMode("login")} />
      )}
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
      <Field
        label="Employee ID"
        icon={Hash}
        placeholder="Enter your employee ID"
        value={employeeId}
        onChange={setEmployeeId}
        error={errors.employeeId}
      />
      <div>
        <label className="mb-2 block text-xs font-medium text-white/70">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-10 pr-11 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-cyan/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)]"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1.5 text-xs text-rose-400">{errors.password}</p>}
      </div>
      <Button type="submit" size="lg" className="group w-full justify-center gap-2" disabled={loading}>
        {loading ? "Signing in…" : "Login"}
        {!loading && (
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        )}
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
    else if (usedEmployeeIds.includes(form.employeeId.trim().toUpperCase()))
      e.employeeId = "This Employee ID is already registered (demo)";
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
        <Button className="mt-5" variant="outline" onClick={onDone}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="First Name"
          icon={User}
          placeholder="First name"
          value={form.firstName}
          onChange={(v) => setForm({ ...form, firstName: v })}
          error={errors.firstName}
        />
        <Field
          label="Last Name"
          icon={User}
          placeholder="Last name"
          value={form.lastName}
          onChange={(v) => setForm({ ...form, lastName: v })}
          error={errors.lastName}
        />
      </div>
      <Field
        label="Email ID"
        type="email"
        icon={User}
        placeholder="you@company.com"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
        error={errors.email}
      />
      <Field
        label="Mobile Number"
        icon={User}
        placeholder="+91 9876543210"
        value={form.mobile}
        onChange={(v) => setForm({ ...form, mobile: v })}
        error={errors.mobile}
      />
      <Field
        label="Employee ID"
        icon={Hash}
        placeholder="Enter your employee ID"
        value={form.employeeId}
        onChange={(v) => setForm({ ...form, employeeId: v })}
        error={errors.employeeId}
      />
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Submitting…" : "Register"}
      </Button>
    </form>
  );
}
