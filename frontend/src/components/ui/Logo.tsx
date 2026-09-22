import { cn } from "@/lib/utils/cn";

export function Logo({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nitGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00D4FF" />
            <stop offset="1" stopColor="#7868FF" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 L36 8 V19 C36 28.5 29.5 35.5 20 38 C10.5 35.5 4 28.5 4 19 V8 L20 2Z"
          fill="url(#nitGrad)"
          opacity="0.15"
        />
        <path
          d="M20 4 L34 9 V19 C34 27.3 28.3 33.4 20 36 C11.7 33.4 6 27.3 6 19 V9 L20 4Z"
          stroke="url(#nitGrad)"
          strokeWidth="2"
        />
        <circle cx="20" cy="18" r="6" stroke="url(#nitGrad)" strokeWidth="2" />
        <circle cx="20" cy="18" r="2" fill="url(#nitGrad)" />
        <path d="M14 27c1.5-2.5 4-4 6-4s4.5 1.5 6 4" stroke="url(#nitGrad)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={cn("text-lg font-bold tracking-tight", mono ? "text-white" : "text-ink")}>
        nit <span className="font-light">Solution</span>
      </span>
    </div>
  );
}
