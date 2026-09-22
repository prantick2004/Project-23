import { cn } from "@/lib/utils/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "violet";

const toneMap: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-600 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-600 ring-amber-600/20",
  danger: "bg-rose-50 text-rose-600 ring-rose-600/20",
  info: "bg-sky-50 text-sky-600 ring-sky-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-600/10",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        toneMap[tone]
      )}
    >
      {children}
    </span>
  );
}
