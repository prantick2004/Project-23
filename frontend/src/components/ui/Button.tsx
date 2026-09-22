"use client";
import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-gradient-to-r from-cyan to-violet text-midnight shadow-glow hover:brightness-110 active:scale-[0.98]",
          variant === "secondary" &&
            "bg-deep-blue text-white hover:bg-[#1a3a63] active:scale-[0.98]",
          variant === "outline" &&
            "border border-white/20 text-white hover:bg-white/10 active:scale-[0.98]",
          variant === "ghost" && "text-ink hover:bg-black/5 active:scale-[0.98]",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-5 py-2.5 text-sm",
          size === "lg" && "px-7 py-3.5 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
