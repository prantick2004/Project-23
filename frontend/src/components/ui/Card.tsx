import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-black/5 bg-white p-5 shadow-card transition-shadow hover:shadow-lg",
        className
      )}
      {...props}
    />
  );
}

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-xl2 p-5", className)} {...props} />;
}
