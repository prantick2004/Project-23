"use client";
import { useState } from "react";
import { PublicNavbar } from "@/components/navigation/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!/^\+?[0-9\s-]{7,15}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  }

  return (
    <main className="bg-midnight">
      <PublicNavbar />
      <section className="bg-hero-gradient bg-grid-glow px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Contact Us</h1>
          <p className="mt-4 text-white/70">This form is validated locally for this demo. No message is sent to a server.</p>
        </div>

        <div className="mx-auto mt-12 max-w-xl glass rounded-xl2 p-8">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="mt-4 font-semibold text-white">Message captured (demo)</p>
              <p className="mt-1 text-sm text-white/60">This is a frontend-only success state. No email was sent.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: "name", label: "Name", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "phone", label: "Phone", type: "text" },
                { key: "subject", label: "Subject", type: "text" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-xs font-medium text-white/70">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan/60"
                  />
                  {errors[f.key] && <p className="mt-1 text-xs text-rose-400">{errors[f.key]}</p>}
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-white/70">Message</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-cyan/60"
                />
                {errors.message && <p className="mt-1 text-xs text-rose-400">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
