"use client";
import { motion } from "framer-motion";
import { Camera, Wifi, WifiOff } from "lucide-react";

const demoCams = [
  { name: "Main Entrance", status: "online" },
  { name: "Sales Floor A", status: "online" },
  { name: "Warehouse Aisle", status: "connecting" },
  { name: "Server Room", status: "online" },
  { name: "Parking Lot", status: "offline" },
  { name: "Reception Desk", status: "online" },
];

export function CctvPreview() {
  return (
    <section className="bg-deep-blue/30 px-5 py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Live CCTV Monitoring Preview</h2>
          <p className="mt-4 max-w-lg text-white/60">
            A centralized grid view of every camera across every store — status, location, and
            health at a glance. All footage shown here is sample demo content.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2"><Wifi className="h-4 w-4 text-emerald-400" /> Online / Offline / Connecting / Error states</li>
            <li className="flex items-center gap-2"><Camera className="h-4 w-4 text-cyan" /> USB, IP, RTSP &amp; CCTV support</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {demoCams.map((cam, i) => (
            <motion.div
              key={cam.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass rounded-lg p-2.5"
            >
              <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-midnight to-deep-blue">
                <Camera className="h-6 w-6 text-white/20" />
                <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white/70">
                  Demo Preview
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="truncate text-[11px] font-medium text-white/80">{cam.name}</span>
                {cam.status === "offline" ? (
                  <WifiOff className="h-3 w-3 text-rose-400" />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      cam.status === "online" ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
