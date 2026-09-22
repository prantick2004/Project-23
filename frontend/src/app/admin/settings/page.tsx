"use client";
import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const initialSettings = {
  confidenceThreshold: 55,
  unknownThreshold: 70,
  lateThresholdMinutes: 15,
  emailAlertsEnabled: true,
  smsAlertsEnabled: false,
  evidenceRetentionDays: 90,
  phoneDetectionEnabled: true,
  sleepDetectionEnabled: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  return (
    <AdminShell title="Settings">
      <DemoBanner text="Settings below are stored in local component state only for this demo and reset on reload." />

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">Recognition Thresholds</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Confidence Threshold" value={settings.confidenceThreshold} onChange={(v) => update("confidenceThreshold", v)} suffix="%" />
          <SliderField label="Unknown Person Threshold" value={settings.unknownThreshold} onChange={(v) => update("unknownThreshold", v)} suffix="%" />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">Attendance & Retention</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField label="Late Threshold (minutes)" value={settings.lateThresholdMinutes} onChange={(v) => update("lateThresholdMinutes", v)} />
          <NumberField label="Evidence Retention (days)" value={settings.evidenceRetentionDays} onChange={(v) => update("evidenceRetentionDays", v)} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-ink">Alerts & Detection</h3>
        <div className="space-y-3">
          <ToggleField label="Email Alerts" checked={settings.emailAlertsEnabled} onChange={(v) => update("emailAlertsEnabled", v)} />
          <ToggleField label="SMS Alerts" checked={settings.smsAlertsEnabled} onChange={(v) => update("smsAlertsEnabled", v)} />
          <ToggleField label="Mobile Phone Detection" checked={settings.phoneDetectionEnabled} onChange={(v) => update("phoneDetectionEnabled", v)} />
          <ToggleField label="Sleep / Inactivity Detection" checked={settings.sleepDetectionEnabled} onChange={(v) => update("sleepDetectionEnabled", v)} />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => setSaved(true)}>Save Settings</Button>
        {saved && <span className="text-xs font-medium text-emerald-600">Saved locally (demo) ✓</span>}
      </div>
    </AdminShell>
  );
}

function SliderField({ label, value, onChange, suffix = "" }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-medium text-muted">
        <span>{label}</span><span>{value}{suffix}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-cyan" />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm" />
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-black/5 px-4 py-3">
      <span className="text-sm text-ink">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-cyan" />
    </label>
  );
}
