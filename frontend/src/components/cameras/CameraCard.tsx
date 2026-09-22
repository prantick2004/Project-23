"use client";
import { useState } from "react";
import { Camera as CameraIcon, Maximize2, Wifi, WifiOff, Loader2, AlertTriangle, X } from "lucide-react";
import { Camera } from "@/types";
import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<Camera["status"], { tone: "success" | "neutral" | "warning" | "danger"; icon: any; label: string }> = {
  online: { tone: "success", icon: Wifi, label: "Online" },
  offline: { tone: "neutral", icon: WifiOff, label: "Offline" },
  connecting: { tone: "warning", icon: Loader2, label: "Connecting" },
  error: { tone: "danger", icon: AlertTriangle, label: "Error" },
};

export function CameraCard({ camera }: { camera: Camera }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[camera.status];
  const Icon = cfg.icon;

  return (
    <>
      <div className="rounded-xl2 border border-black/5 bg-white p-3 shadow-card transition-transform hover:-translate-y-0.5">
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-deep-blue to-midnight">
          {camera.status === "online" ? (
            <CameraIcon className="h-8 w-8 text-cyan/50" />
          ) : camera.status === "connecting" ? (
            <Loader2 className="h-7 w-7 animate-spin text-amber-400/70" />
          ) : (
            <CameraIcon className="h-8 w-8 text-white/15" />
          )}
          <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">Demo Preview</span>
          <button
            onClick={() => setExpanded(true)}
            className="absolute bottom-2 right-2 rounded-md bg-black/50 p-1.5 text-white/80 hover:bg-black/70"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{camera.name}</p>
            <p className="text-[11px] text-muted">{camera.cameraId} · {camera.storeName}</p>
          </div>
          <Badge tone={cfg.tone}>
            <Icon className={`h-3 w-3 ${camera.status === "connecting" ? "animate-spin" : ""}`} /> {cfg.label}
          </Badge>
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setExpanded(false)}>
          <div className="w-full max-w-2xl rounded-xl2 bg-midnight p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{camera.name}</p>
                <p className="text-xs text-white/50">{camera.location} · {camera.storeName}</p>
              </div>
              <button onClick={() => setExpanded(false)}><X className="h-5 w-5 text-white/60" /></button>
            </div>
            <div className="flex h-80 items-center justify-center rounded-lg bg-gradient-to-br from-deep-blue to-midnight">
              <div className="text-center">
                <CameraIcon className="mx-auto h-10 w-10 text-cyan/40" />
                <p className="mt-3 text-xs text-white/50">Demo Preview — no live stream connected</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
