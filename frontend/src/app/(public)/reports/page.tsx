import { mockReports } from "@/lib/mock-data/operations";
import { FileBarChart } from "lucide-react";

export default function PublicReportsPage() {
  return (
    <main>
      <section className="bg-hero-gradient bg-grid-glow px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Reports &amp; Analytics</h1>
          <p className="mt-6 text-white/70">
            Generate attendance, activity, and security reports — exportable to PDF, Excel, or CSV.
            No private employee or camera data is shown on this public page.
          </p>
        </div>
      </section>
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
          {mockReports.map((r) => (
            <div key={r.id} className="glass rounded-xl2 p-6">
              <FileBarChart className="h-5 w-5 text-cyan" />
              <h3 className="mt-3 text-base font-semibold text-white">{r.title}</h3>
              <p className="mt-2 text-sm text-white/60">{r.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
