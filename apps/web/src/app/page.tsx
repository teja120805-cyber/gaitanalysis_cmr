"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  HeartPulse,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MotionCard, Stagger } from "@/components/ui/motion";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { LEVEL } from "@/lib/risk";
import { apiGet } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

// Deterministic demo series
const fleetTrend = Array.from({ length: 24 }, (_, i) => ({
  label: `${String(i).padStart(2, "0")}:00`,
  value: Math.round(28 + 12 * Math.sin(i / 3) + (i > 16 ? (i - 16) * 2.4 : 0) + (i % 3)),
}));

const spark = {
  patients: [8, 9, 9, 10, 11, 11, 12, 12],
  sessions: [1, 2, 1, 3, 2, 3, 2, 2],
  high: [0, 1, 0, 1, 2, 1, 2, 1],
  avg: [22, 25, 24, 28, 31, 29, 34, 33],
};

interface Summary {
  total_patients: number;
  active_patients: number;
  high_risk_patients: number;
  open_alerts: number;
  devices: { online: number; total: number };
  distribution: { normal: number; mild: number; high: number };
}

const FALLBACK_SUMMARY: Summary = {
  total_patients: 12,
  active_patients: 2,
  high_risk_patients: 1,
  open_alerts: 3,
  devices: { online: 27, total: 30 },
  distribution: { normal: 7, mild: 4, high: 1 },
};

const activeSessions = [
  { id: "pt-3390", name: "Priya Nadar", room: "Rehab-2 · 204", level: "high" as const, elapsed: "12:44", score: 71 },
  { id: "pt-1042", name: "Eleanor Whitfield", room: "Neuro-3B · 312", level: "mild" as const, elapsed: "27:10", score: 41 },
];

const recentAlerts = [
  { id: "a1", level: "high" as const, title: "High fall-risk · Priya Nadar", time: "2m ago" },
  { id: "a2", level: "mild" as const, title: "Gait deviation · Eleanor Whitfield", time: "11m ago" },
  { id: "a3", level: "mild" as const, title: "Cadence slowing · Daniel Okafor", time: "24m ago" },
];

export default function DashboardPage() {
  const { data: s, source } = useApiData(
    () => apiGet<Summary>("/api/dashboard/summary"),
    FALLBACK_SUMMARY,
    []
  );
  const distTotal = s.distribution.normal + s.distribution.mild + s.distribution.high || 1;
  const distribution = [
    { level: "normal" as const, count: s.distribution.normal, pct: Math.round((s.distribution.normal / distTotal) * 100) },
    { level: "mild" as const, count: s.distribution.mild, pct: Math.round((s.distribution.mild / distTotal) * 100) },
    { level: "high" as const, count: s.distribution.high, pct: Math.round((s.distribution.high / distTotal) * 100) },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Neurology ward · real-time fall-risk overview">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        {/* Data source indicator */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
              source === "backend" ? "bg-good/10 text-good-ink" : "bg-surface-2 text-muted"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", source === "backend" ? "animate-pulse bg-good" : "bg-muted")} />
            {source === "backend" ? "Live data · GaitGuard API" : "Demo data"}
          </span>
        </div>

        {/* KPI row */}
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total patients" value={s.total_patients} icon={Users} tone="primary" delta="+2" deltaGood spark={spark.patients} />
          <KpiCard label="Active patients" value={s.active_patients} icon={Activity} tone="primary" delta="live" deltaGood spark={spark.sessions} />
          <KpiCard label="High risk patients" value={s.high_risk_patients} icon={HeartPulse} tone="critical" delta="-1" deltaGood spark={spark.high} />
          <KpiCard label="Today's alerts" value={s.open_alerts} icon={BellRing} tone="warning" delta="+4" deltaGood={false} spark={spark.avg} />
        </Stagger>

        {/* Row 2: trend + distribution */}
        <Stagger className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <MotionCard className="xl:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">Fleet Risk Trend</h3>
                <p className="text-[11px] text-muted">Average ward risk score · last 24 hours</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Live
              </span>
            </div>
            <div className="p-4">
              <AreaTrend data={fleetTrend} unit="%" domain={[0, 70]} height={264} />
            </div>
          </MotionCard>

          <MotionCard className="p-5">
            <h3 className="text-sm font-semibold text-ink">Risk Distribution</h3>
            <p className="text-[11px] text-muted">Current ward census · 12 patients</p>
            <div className="mt-5 space-y-4">
              {distribution.map((d) => {
                const meta = LEVEL[d.level];
                return (
                  <div key={d.level}>
                    <div className="mb-1.5 flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-2 text-ink-secondary">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                        {meta.label}
                      </span>
                      <span className="tnum text-muted">
                        {d.count} · {d.pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-xl border border-line bg-surface-2 p-3 text-[12px] text-ink-secondary">
              <span className="font-medium text-ink">1 patient</span> requires immediate
              attention. Freezing-of-gait detected in the last 5 minutes.
            </div>
          </MotionCard>
        </Stagger>

        {/* Row 2.5: analytics + device status */}
        <Stagger className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AnalyticsCard />
          <DeviceStatusCard />
        </Stagger>

        {/* Row 3: active sessions + alerts */}
        <Stagger className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <MotionCard className="xl:col-span-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Active Monitoring Sessions</h3>
              <Link href="/patients" className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
                All patients <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              {activeSessions.map((s) => {
                const meta = LEVEL[s.level];
                return (
                  <Link key={s.id} href={`/monitor/${s.id}`}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="group relative overflow-hidden rounded-xl border border-line bg-surface-2 p-4"
                      style={{ boxShadow: `inset 3px 0 0 0 ${meta.color}` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-ink">{s.name}</div>
                          <div className="text-[11px] text-muted">{s.room}</div>
                        </div>
                        <StatusPill level={s.level} size="sm" pulse />
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-muted">Risk score</div>
                          <div className="tnum text-2xl font-semibold" style={{ color: meta.color }}>
                            {s.score}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted">Elapsed</div>
                          <div className="tnum text-sm font-medium text-ink">{s.elapsed}</div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </MotionCard>

          <MotionCard>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-sm font-semibold text-ink">Recent Alerts</h3>
              <Link href="/alerts" className="text-[12px] font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="p-2">
              {recentAlerts.map((a) => {
                const meta = LEVEL[a.level];
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${meta.color}1a` }}>
                      <AlertTriangle size={14} style={{ color: meta.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{a.title}</div>
                      <div className="text-[11px] text-muted">{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 pt-1">
              <Button variant="secondary" size="sm" className="w-full">
                Open triage queue
              </Button>
            </div>
          </MotionCard>
        </Stagger>
      </div>
    </AppShell>
  );
}
