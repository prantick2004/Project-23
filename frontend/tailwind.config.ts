import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#0B1220",
        "deep-blue": "#142B4A",
        cyan: {
          DEFAULT: "#00D4FF",
          soft: "#5FE3FF",
        },
        violet: {
          DEFAULT: "#7868FF",
          soft: "#A79BFF",
        },
        surface: "#F4F7FB",
        ink: "#172033",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(0, 212, 255, 0.25)",
        "glow-violet": "0 0 40px rgba(120, 104, 255, 0.25)",
        card: "0 8px 30px rgba(11, 18, 32, 0.08)",
        "card-dark": "0 8px 30px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(0,212,255,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(120,104,255,0.18), transparent 45%)",
        "hero-gradient": "linear-gradient(135deg, #0B1220 0%, #142B4A 60%, #1B3A63 100%)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
