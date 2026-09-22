import { Info } from "lucide-react";

export function DemoBanner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
      <Info className="h-4 w-4 shrink-0" />
      <span>
        {text ??
          "Demo data only. Changes made here are frontend-only and are not saved to any backend or database."}
      </span>
    </div>
  );
}
