"use client";
import { useEffect, useRef } from "react";

const BLOBS = [
  {
    className: "ambient-blob",
    style: {
      top: "-10%",
      right: "-8%",
      width: "56vw",
      height: "56vw",
      maxWidth: 760,
      maxHeight: 760,
      background:
        "radial-gradient(circle at 50% 50%, rgba(109,93,251,0.55) 0%, rgba(109,93,251,0) 70%)",
      animation: "ambientDriftA 42s ease-in-out infinite",
    } as React.CSSProperties,
  },
  {
    className: "ambient-blob",
    style: {
      top: "8%",
      left: "38%",
      width: "48vw",
      height: "48vw",
      maxWidth: 640,
      maxHeight: 640,
      background:
        "radial-gradient(circle at 50% 50%, rgba(217,70,239,0.4) 0%, rgba(217,70,239,0) 70%)",
      animation: "ambientDriftB 55s ease-in-out infinite",
    } as React.CSSProperties,
  },
  {
    className: "ambient-blob",
    style: {
      bottom: "-14%",
      left: "-10%",
      width: "58vw",
      height: "58vw",
      maxWidth: 780,
      maxHeight: 780,
      background:
        "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0) 70%)",
      animation: "ambientDriftC 48s ease-in-out infinite",
    } as React.CSSProperties,
  },
  {
    className: "ambient-blob",
    style: {
      bottom: "0%",
      right: "6%",
      width: "34vw",
      height: "34vw",
      maxWidth: 460,
      maxHeight: 460,
      background:
        "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0) 70%)",
      animation: "ambientDriftD 60s ease-in-out infinite",
    } as React.CSSProperties,
  },
  {
    className: "ambient-blob hidden sm:block",
    style: {
      top: "35%",
      right: "20%",
      width: "26vw",
      height: "26vw",
      maxWidth: 360,
      maxHeight: 360,
      background:
        "radial-gradient(circle at 50% 50%, rgba(244,114,182,0.28) 0%, rgba(244,114,182,0) 70%)",
      animation: "ambientDriftB 50s ease-in-out infinite reverse",
    } as React.CSSProperties,
  },
];

/**
 * Fixed, full-viewport ambient background: dark base + slowly drifting
 * blurred color fields (transform/opacity only — GPU-cheap, no JS loop),
 * a faint static grain, a soft vignette, and an optional subtle
 * mouse-follow glow (desktop / fine-pointer only, throttled, and skipped
 * entirely under prefers-reduced-motion).
 */
export function AmbientBackground() {
  const cursorLayerRef = useRef<HTMLDivElement>(null);
  const lastMoveRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    function handlePointerMove(e: PointerEvent) {
      const now = performance.now();
      if (now - lastMoveRef.current < 60) return; // throttle, no rAF loop
      lastMoveRef.current = now;
      const xPct = (e.clientX / window.innerWidth) * 100;
      const yPct = (e.clientY / window.innerHeight) * 100;
      cursorLayerRef.current?.style.setProperty("--mx", `${xPct}%`);
      cursorLayerRef.current?.style.setProperty("--my", `${yPct}%`);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05070D]"
    >
      {BLOBS.map((b, i) => (
        <div key={i} className={b.className} style={b.style} />
      ))}

      <div
        ref={cursorLayerRef}
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(480px circle at var(--mx, 50%) var(--my, 30%), rgba(139,92,246,0.10), transparent 70%)",
        }}
      />

      <div className="ambient-grain absolute inset-0 opacity-[0.035] mix-blend-overlay" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
