const stats = [
  { label: "Stores Supported", value: "Multi-Store" },
  { label: "Camera Types", value: "USB / IP / RTSP / CCTV" },
  { label: "Recognition", value: "Real-Time" },
  { label: "Reports", value: "PDF / Excel / CSV" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-white/10 bg-deep-blue/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center lg:text-left">
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/50">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
