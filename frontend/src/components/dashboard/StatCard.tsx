import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, tone = "cyan", sub,
}: {
  label: string; value: string | number; icon: LucideIcon; tone?: "cyan" | "violet" | "emerald" | "rose"; sub?: string;
}) {
  const toneMap = {
    cyan: "from-cyan/15 to-cyan/5 text-cyan",
    violet: "from-violet/15 to-violet/5 text-violet",
    emerald: "from-emerald-400/15 to-emerald-400/5 text-emerald-500",
    rose: "from-rose-400/15 to-rose-400/5 text-rose-500",
  };
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
      </div>
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", toneMap[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  );
}
