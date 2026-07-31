"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Activity,
  Bell,
  Building2,
  Cpu,
  Database,
  KeyRound,
  Moon,
  Palette,
  ScrollText,
  ShieldCheck,
  Sun,
  User,
  Users2,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MotionCard } from "@/components/ui/motion";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "hospital", label: "Hospital", icon: Building2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "devices", label: "Devices", icon: Cpu },
  { id: "apikeys", label: "API Keys", icon: KeyRound },
  { id: "roles", label: "Roles", icon: Users2 },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "database", label: "Database", icon: Database },
  { id: "health", label: "System Health", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <AppShell title="Settings" subtitle="Account, appearance & devices">
      <div className="mx-auto max-w-[1100px] p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          {/* Tab nav */}
          <MotionCard className="h-fit p-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-primary-ink" : "text-ink-secondary hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="settings-active"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-primary-soft"
                    />
                  )}
                  <Icon size={16} className={cn("relative z-10", active ? "text-primary" : "text-muted")} />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </MotionCard>

          {/* Content */}
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {tab === "profile" && <ProfileTab />}
            {tab === "hospital" && <HospitalTab />}
            {tab === "appearance" && <AppearanceTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "devices" && <DevicesTab />}
            {tab === "apikeys" && <ApiKeysTab />}
            {tab === "roles" && <RolesTab />}
            {tab === "security" && <SecurityTab />}
            {tab === "logs" && <LogsTab />}
            {tab === "database" && <DatabaseTab />}
            {tab === "health" && <HealthTab />}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <MotionCard className="p-6">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-[12px] text-muted">{desc}</p>
      <div className="mt-5">{children}</div>
    </MotionCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-secondary">{label}</span>
      <input
        defaultValue={value}
        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function ProfileTab() {
  return (
    <Section title="Profile" desc="Your clinician identity across the console.">
      <div className="mb-5 flex items-center gap-4">
        <span className="brand-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white">RO</span>
        <div>
          <Button variant="secondary" size="sm">Change photo</Button>
          <p className="mt-1.5 text-[11px] text-muted">JPG or PNG · max 2MB</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" value="Dr. R. Okonkwo" />
        <Field label="Email" value="okonkwo@gaitguard.health" />
        <Field label="Department" value="Neurology" />
        <Field label="Role" value="Clinician" />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button size="sm">Save changes</Button>
      </div>
    </Section>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  return (
    <Section title="Appearance" desc="Choose how GaitGuard looks on this device.">
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: "light", label: "Light", icon: Sun },
          { id: "dark", label: "Dark", icon: Moon },
        ].map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={cn(
                "group flex flex-col items-start gap-3 rounded-2xl border p-4 transition-all",
                active ? "border-primary/50 bg-primary-soft" : "border-line bg-surface-2 hover:border-line-strong"
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-primary text-white" : "bg-surface text-muted")}>
                <Icon size={17} />
              </div>
              <div className={cn("text-sm font-medium", active ? "text-primary-ink" : "text-ink")}>{opt.label}</div>
              {/* Mini preview */}
              <div className={cn("h-12 w-full rounded-lg border", opt.id === "dark" ? "border-white/10 bg-[#0f1826]" : "border-black/5 bg-white")}>
                <div className="flex gap-1 p-2">
                  <span className="brand-gradient h-2 w-8 rounded-full" />
                  <span className={cn("h-2 w-5 rounded-full", opt.id === "dark" ? "bg-white/20" : "bg-black/10")} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl border border-line bg-surface-2 p-4 text-[12px] text-ink-secondary">
        Imaging viewports (3D skeleton & pressure map) stay on a dark instrument surface in both themes — matching clinical PACS conventions.
      </div>
    </Section>
  );
}

function Toggle({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between border-b border-line py-3.5 last:border-0">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-[11px] text-muted">{desc}</div>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-primary" : "bg-surface-3")}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          style={{ left: on ? 22 : 2 }}
        />
      </button>
    </div>
  );
}

function NotificationsTab() {
  return (
    <Section title="Notifications" desc="Control what triggers an alert and how you're notified.">
      <Toggle label="High fall-risk alerts" desc="Immediate push when a patient enters the High band" defaultOn />
      <Toggle label="Mild-risk trends" desc="Notify when gait deviations trend upward" defaultOn />
      <Toggle label="Freezing-of-gait detection" desc="Real-time alert on freezing episodes" defaultOn />
      <Toggle label="Device disconnections" desc="Alert when an insole or camera drops offline" />
      <Toggle label="Daily digest email" desc="Summary of ward risk each morning" defaultOn />
    </Section>
  );
}

function DevicesTab() {
  const devices = [
    { name: "Insole · Left (ESP32-A1)", patient: "Priya Nadar", status: "online", battery: "84%" },
    { name: "Insole · Right (ESP32-A2)", patient: "Priya Nadar", status: "online", battery: "81%" },
    { name: "Vision cam · Rehab-2", patient: "Room 204", status: "online", battery: "—" },
    { name: "Insole · Left (ESP32-B7)", patient: "Marcus Bell", status: "offline", battery: "12%" },
  ];
  return (
    <Section title="Paired Devices" desc="Insole and camera hardware linked to patients.">
      <div className="space-y-2">
        {devices.map((d) => (
          <div key={d.name} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", d.status === "online" ? "bg-good/10 text-good-ink" : "bg-muted/10 text-muted")}>
                <Cpu size={16} />
              </span>
              <div>
                <div className="text-[13px] font-medium text-ink">{d.name}</div>
                <div className="text-[11px] text-muted">{d.patient}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="tnum text-[11px] text-muted">{d.battery}</span>
              <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", d.status === "online" ? "text-good-ink" : "text-muted")}>
                <span className={cn("h-2 w-2 rounded-full", d.status === "online" ? "bg-good" : "bg-muted")} />
                {d.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SecurityTab() {
  return (
    <Section title="Security" desc="Protect access to patient data.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current password" value="" />
        <div />
        <Field label="New password" value="" />
        <Field label="Confirm password" value="" />
      </div>
      <div className="mt-5">
        <Toggle label="Two-factor authentication" desc="Require an authenticator code at sign-in" defaultOn />
        <Toggle label="Sign out inactive sessions" desc="Auto sign-out after 30 min idle" defaultOn />
      </div>
      <div className="mt-6 flex justify-end">
        <Button size="sm">Update password</Button>
      </div>
    </Section>
  );
}

function HospitalTab() {
  return (
    <Section title="Hospital Details" desc="Facility profile used across reports and exports.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Facility name" value="St. Aldric's Medical Center" />
        <Field label="Department" value="Neurology · Gait Laboratory" />
        <Field label="Address" value="14 Parkside Ave, London" />
        <Field label="Phone" value="+44 20 7946 0000" />
        <Field label="Accreditation ID" value="NHS-GG-4471" />
        <Field label="Time zone" value="Europe/London (GMT)" />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button size="sm">Save details</Button>
      </div>
    </Section>
  );
}

function ApiKeysTab() {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState<string | null>(null);
  const keys = [
    { id: "prod", label: "Production", key: "gg_live_9f2c7a41e8b640d3a1", created: "12 Jun 2026", scope: "read/write" },
    { id: "ingest", label: "Device ingest", key: "gg_ingest_3b81d0c6f45e2a19", created: "02 Jul 2026", scope: "ingest" },
    { id: "ro", label: "Analytics (read-only)", key: "gg_ro_7d5490ab13c8e2f0", created: "18 Jul 2026", scope: "read" },
  ];
  return (
    <Section title="API Keys" desc="Programmatic access for devices and integrations.">
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[13px] font-medium text-ink">{k.label}</div>
              <div className="tnum text-[11px] text-muted">
                {revealed === k.id ? k.key : `${k.key.slice(0, 10)}••••••••••`} · {k.scope} · created {k.created}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRevealed(revealed === k.id ? null : k.id)}>
                {revealed === k.id ? "Hide" : "Reveal"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard?.writeText(k.key); toast({ tone: "success", title: "Key copied" }); }}>
                Copy
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button size="sm" onClick={() => toast({ tone: "success", title: "New API key generated", detail: "Store it securely — shown once" })}>
          <KeyRound size={14} /> Generate new key
        </Button>
      </div>
    </Section>
  );
}

function RolesTab() {
  const roles = [
    { role: "Admin", users: 3, perms: "Full access · user & device management" },
    { role: "Clinician", users: 12, perms: "Assigned patients · monitor, report, ack alerts" },
    { role: "Caregiver", users: 8, perms: "Read-only live + alerts for linked patients" },
    { role: "Patient", users: 41, perms: "Own history & reports only" },
  ];
  return (
    <Section title="Roles & Permissions" desc="Role-based access control across the organization.">
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Users</th>
              <th className="px-4 py-2.5 font-medium">Permissions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.role} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{r.role}</td>
                <td className="tnum px-4 py-3 text-ink-secondary">{r.users}</td>
                <td className="px-4 py-3 text-[12px] text-ink-secondary">{r.perms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function LogsTab() {
  const logs = [
    { t: "09:14:02", user: "Dr. R. Okonkwo", action: "Acknowledged alert al-8842", ip: "10.2.4.11" },
    { t: "09:12:47", user: "system", action: "Risk band HIGH · pt-3390", ip: "—" },
    { t: "08:59:31", user: "Dr. A. Lindqvist", action: "Generated report rep-pt-1042-1", ip: "10.2.4.19" },
    { t: "08:40:10", user: "system", action: "Session started · pt-1042", ip: "—" },
    { t: "08:22:55", user: "admin", action: "Paired device ESP32-B7", ip: "10.2.4.2" },
  ];
  return (
    <Section title="Audit Logs" desc="Immutable record of sensitive actions.">
      <div className="space-y-1.5 font-mono text-[11px]">
        {logs.map((l, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2">
            <span className="tnum text-muted">{l.t}</span>
            <span className="font-semibold text-primary">{l.user}</span>
            <span className="flex-1 text-ink-secondary">{l.action}</span>
            <span className="tnum hidden text-muted sm:block">{l.ip}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DatabaseTab() {
  const tables = [
    { name: "patients", rows: "1,204", size: "2.1 MB" },
    { name: "sensor_samples", rows: "18.4 M", size: "3.6 GB" },
    { name: "risk_scores", rows: "912 K", size: "184 MB" },
    { name: "alerts", rows: "6,120", size: "4.2 MB" },
    { name: "reports", rows: "842", size: "36 MB" },
  ];
  return (
    <Section title="Database Status" desc="PostgreSQL + TimescaleDB cluster.">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Status" value="Healthy" tone="good" />
        <StatBox label="Connections" value="42 / 100" />
        <StatBox label="Replication lag" value="0.3 s" />
        <StatBox label="Disk used" value="61%" tone="warn" />
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5 font-medium">Table</th>
              <th className="px-4 py-2.5 font-medium">Rows</th>
              <th className="px-4 py-2.5 font-medium">Size</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.name} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink">{t.name}</td>
                <td className="tnum px-4 py-2.5 text-ink-secondary">{t.rows}</td>
                <td className="tnum px-4 py-2.5 text-ink-secondary">{t.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function HealthTab() {
  const services = [
    { name: "API gateway", status: "operational", latency: "38 ms" },
    { name: "Fusion engine", status: "operational", latency: "12 ms" },
    { name: "WebSocket hub", status: "operational", latency: "5 ms" },
    { name: "Vision workers", status: "degraded", latency: "210 ms" },
    { name: "Database", status: "operational", latency: "3 ms" },
  ];
  const meters = [
    { label: "CPU", pct: 42 },
    { label: "Memory", pct: 58 },
    { label: "GPU (vision)", pct: 73 },
    { label: "Network I/O", pct: 31 },
  ];
  return (
    <Section title="System Health" desc="Real-time platform status.">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {meters.map((m) => (
          <div key={m.label} className="rounded-xl border border-line bg-surface-2 p-3">
            <div className="mb-1.5 flex justify-between text-[11px]">
              <span className="text-muted">{m.label}</span>
              <span className="tnum text-ink">{m.pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.pct > 70 ? "var(--status-warning)" : "var(--primary)" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-2.5">
            <span className="text-[13px] font-medium text-ink">{s.name}</span>
            <div className="flex items-center gap-4">
              <span className="tnum text-[11px] text-muted">{s.latency}</span>
              <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", s.status === "operational" ? "text-good-ink" : "text-warning-ink")}>
                <span className={cn("h-2 w-2 rounded-full", s.status === "operational" ? "bg-good" : "bg-warning")} />
                {s.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={cn("mt-0.5 text-base font-semibold", tone === "good" ? "text-good-ink" : tone === "warn" ? "text-warning-ink" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}
