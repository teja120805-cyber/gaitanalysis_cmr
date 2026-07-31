"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryLow,
  Bell,
  Check,
  ChevronRight,
  Footprints,
  HeartPulse,
  Mail,
  MessageSquare,
  ShieldAlert,
  WifiOff,
  X,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MotionCard, Stagger } from "@/components/ui/motion";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useApiData } from "@/hooks/useApiData";
import { apiGet, apiSend } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ApiAlert {
  id: string;
  type: string;
  priority: string;
  level: string;
  patient_id: string;
  patient_name: string | null;
  title: string;
  detail: string;
  status: string;
  created_at: string;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(diff / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.floor(h / 24)} d ago`;
}

function fromApi(a: ApiAlert): Row {
  return {
    id: a.id,
    type: (a.type as AlertType) ?? "high_risk",
    priority: (a.priority as Priority) ?? "high",
    patient: a.patient_name ?? "Unknown patient",
    patientId: a.patient_id,
    message: a.detail,
    time: relTime(a.created_at),
    status: (a.status as Status) ?? "open",
  };
}

type AlertType = "fall" | "high_risk" | "abnormal_pressure" | "sensor_failure" | "low_battery";
type Priority = "critical" | "high" | "medium" | "low";
type Status = "open" | "acknowledged" | "resolved";

interface Row {
  id: string;
  type: AlertType;
  priority: Priority;
  patient: string;
  patientId: string;
  message: string;
  time: string;
  status: Status;
}

const TYPE_META: Record<AlertType, { label: string; icon: typeof Bell; color: string }> = {
  fall: { label: "Fall Detection", icon: ShieldAlert, color: "var(--status-critical)" },
  high_risk: { label: "High Risk", icon: HeartPulse, color: "var(--status-critical)" },
  abnormal_pressure: { label: "Abnormal Pressure", icon: Footprints, color: "var(--status-warning)" },
  sensor_failure: { label: "Sensor Failure", icon: WifiOff, color: "var(--status-serious)" },
  low_battery: { label: "Low Battery", icon: BatteryLow, color: "var(--status-warning)" },
};

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  critical: { label: "P1 · Critical", cls: "text-critical-ink bg-critical/10" },
  high: { label: "P2 · High", cls: "text-serious bg-serious/10" },
  medium: { label: "P3 · Medium", cls: "text-warning-ink bg-warning/10" },
  low: { label: "P4 · Low", cls: "text-ink-secondary bg-surface-2" },
};

const INITIAL: Row[] = [
  { id: "a1", type: "fall", priority: "critical", patient: "Priya Nadar", patientId: "pt-3390", message: "Fall-pattern detected — sudden load loss + high sway", time: "1 min ago", status: "open" },
  { id: "a2", type: "high_risk", priority: "critical", patient: "Priya Nadar", patientId: "pt-3390", message: "High fall-risk sustained >30s · freezing episode", time: "2 min ago", status: "open" },
  { id: "a3", type: "abnormal_pressure", priority: "high", patient: "Eleanor Whitfield", patientId: "pt-1042", message: "Load asymmetry 68/32 · lateral instability", time: "11 min ago", status: "open" },
  { id: "a4", type: "low_battery", priority: "medium", patient: "Marcus Bell", patientId: "pt-2071", message: "Left insole battery at 12%", time: "20 min ago", status: "acknowledged" },
  { id: "a5", type: "sensor_failure", priority: "high", patient: "Daniel Okafor", patientId: "pt-4415", message: "Vision camera Rehab-2 dropped offline", time: "38 min ago", status: "acknowledged" },
  { id: "a6", type: "abnormal_pressure", priority: "medium", patient: "Priya Nadar", patientId: "pt-3390", message: "Trunk sway above threshold during turn", time: "2 hr ago", status: "resolved" },
];

const FILTERS = [
  { label: "All", value: "all" as const },
  { label: "Open", value: "open" as const },
  { label: "Acknowledged", value: "acknowledged" as const },
  { label: "Resolved", value: "resolved" as const },
];

export default function AlertsPage() {
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [drawer, setDrawer] = useState<Row | null>(null);
  const { toast } = useToast();

  const { data: apiRows, source } = useApiData<ApiAlert[] | null>(
    () => apiGet<ApiAlert[]>("/api/alerts"),
    null,
    []
  );
  useEffect(() => {
    if (apiRows) setRows(apiRows.map(fromApi));
  }, [apiRows]);

  const shown = useMemo(() => rows.filter((r) => filter === "all" || r.status === filter), [rows, filter]);
  const counts = {
    open: rows.filter((r) => r.status === "open").length,
    critical: rows.filter((r) => r.priority === "critical" && r.status === "open").length,
    acknowledged: rows.filter((r) => r.status === "acknowledged").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
  };

  const setStatus = async (id: string, status: Status) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setDrawer((d) => (d && d.id === id ? { ...d, status } : d));
    try {
      if (source === "backend") await apiSend(`/api/alerts/${id}`, "PATCH", { status });
    } catch {
      /* optimistic update already applied */
    }
  };

  return (
    <AppShell title="Alerts" subtitle="Ward-wide triage & notifications">
      <div className="mx-auto max-w-[1200px] p-4 sm:p-6">
        <Stagger className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Open" value={counts.open} tone="text-critical-ink" />
          <Kpi label="Critical (P1)" value={counts.critical} tone="text-critical-ink" />
          <Kpi label="Acknowledged" value={counts.acknowledged} tone="text-warning-ink" />
          <Kpi label="Resolved (24h)" value={counts.resolved} tone="text-good-ink" />
        </Stagger>

        <MotionCard>
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-ink">Alert Queue</h3>
            <Segmented options={FILTERS} value={filter} onChange={setFilter} size="sm" />
          </div>
          <div className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {shown.map((a) => {
                const tm = TYPE_META[a.type];
                const Icon = tm.icon;
                return (
                  <motion.button
                    key={a.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={() => setDrawer(a)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-surface-2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${tm.color}1a` }}>
                      <Icon size={17} style={{ color: tm.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{tm.label}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", PRIORITY_META[a.priority].cls)}>
                          {PRIORITY_META[a.priority].label}
                        </span>
                        <span className="tnum text-[11px] text-muted">{a.time}</span>
                      </div>
                      <div className="truncate text-[12px] text-ink-secondary">
                        {a.patient} · {a.message}
                      </div>
                    </div>
                    <StatusChip status={a.status} />
                    <ChevronRight size={16} className="shrink-0 text-muted" />
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {shown.length === 0 && <EmptyState icon={Check} title="Nothing here" detail="No alerts match this filter." />}
          </div>
        </MotionCard>
      </div>

      {/* Notification drawer */}
      <AnimatePresence>
        {drawer && (
          <NotificationDrawer
            row={drawer}
            onClose={() => setDrawer(null)}
            onAck={() => { setStatus(drawer.id, "acknowledged"); toast({ tone: "success", title: "Alert acknowledged" }); }}
            onResolve={() => { setStatus(drawer.id, "resolved"); toast({ tone: "success", title: "Alert resolved" }); }}
            onNotify={(ch) => toast({ tone: "info", title: `${ch} queued`, detail: `Care team will be notified via ${ch.toLowerCase()} (placeholder)` })}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function NotificationDrawer({
  row,
  onClose,
  onAck,
  onResolve,
  onNotify,
}: {
  row: Row;
  onClose: () => void;
  onAck: () => void;
  onResolve: () => void;
  onNotify: (ch: "Email" | "SMS") => void;
}) {
  const ref = useClickOutside<HTMLDivElement>(onClose);
  const tm = TYPE_META[row.type];
  const Icon = tm.icon;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      <motion.div
        ref={ref}
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="text-sm font-semibold text-ink">Alert Details</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${tm.color}1a` }}>
              <Icon size={22} style={{ color: tm.color }} />
            </span>
            <div>
              <div className="text-base font-semibold text-ink">{tm.label}</div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", PRIORITY_META[row.priority].cls)}>
                {PRIORITY_META[row.priority].label}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface-2 p-3 text-[13px] text-ink-secondary">{row.message}</div>

          <dl className="grid grid-cols-2 gap-3 text-[12px]">
            <Field label="Patient" value={row.patient} />
            <Field label="Detected" value={row.time} />
            <Field label="Status" value={row.status} />
            <Field label="Alert ID" value={row.id} />
          </dl>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Notify care team</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => onNotify("Email")}>
                <Mail size={14} /> Email
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => onNotify("SMS")}>
                <MessageSquare size={14} /> SMS
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted">Email / SMS delivery are placeholders in the demo build.</p>
          </div>

          <Link href={`/monitor/${row.patientId}`}>
            <Button variant="outline" size="sm" className="w-full">Open live monitor</Button>
          </Link>
        </div>

        <div className="flex gap-2 border-t border-line p-4">
          {row.status !== "acknowledged" && row.status !== "resolved" && (
            <Button variant="secondary" size="sm" className="flex-1" onClick={onAck}>Acknowledge</Button>
          )}
          {row.status !== "resolved" && (
            <Button size="sm" className="flex-1" onClick={onResolve}><Check size={14} /> Resolve</Button>
          )}
          {row.status === "resolved" && <div className="flex-1 text-center text-[12px] font-medium text-good-ink">Resolved</div>}
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-ink">{value}</dd>
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const map = {
    open: "text-critical-ink bg-critical/10",
    acknowledged: "text-warning-ink bg-warning/10",
    resolved: "text-good-ink bg-good/10",
  }[status];
  return <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase sm:inline-flex", map)}>{status}</span>;
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <MotionCard className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className={cn("tnum mt-1 text-3xl font-semibold", tone)}>{value}</div>
    </MotionCard>
  );
}
