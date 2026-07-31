"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Cpu,
  FileText,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MotionCard, Stagger } from "@/components/ui/motion";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { useToast } from "@/components/ui/Toast";
import { LEVEL } from "@/lib/risk";
import type { PatientDetailData } from "@/lib/patientData";

const TABS = [
  { label: "Overview", value: "overview" as const },
  { label: "Sessions", value: "sessions" as const },
  { label: "Pressure", value: "pressure" as const },
  { label: "Reports", value: "reports" as const },
  { label: "History", value: "history" as const },
];

export function PatientDetail({ data }: { data: PatientDetailData }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("overview");
  const { patient } = data;
  const { toast } = useToast();

  return (
    <AppShell title={patient.name} subtitle={`${patient.mrn} · patient profile`}>
      <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
        {/* Header */}
        <MotionCard accent className="overflow-visible p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="brand-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white">
                {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-semibold tracking-tight text-ink">{patient.name}</h2>
                  <StatusPill level={patient.baselineRisk} size="sm" pulse={patient.baselineRisk === "high"} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                  <Meta icon={UserRound} text={`${patient.age}y · ${patient.sex === "F" ? "Female" : "Male"}`} />
                  <Meta icon={Stethoscope} text={data.doctor} />
                  <Meta icon={CalendarClock} text={`Admitted ${data.admitted}`} />
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-ink-secondary">{patient.room}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast({ tone: "info", title: "Generating report…", detail: "Weekly gait analysis for " + patient.name })}
              >
                <FileText size={15} /> Generate report
              </Button>
              <Link href={`/monitor/${patient.id}`}>
                <Button size="sm">
                  <Activity size={15} /> Live monitor
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line bg-surface-2 p-3 text-[13px] text-ink-secondary">
            <span className="font-medium text-ink">Diagnosis · </span>
            {patient.condition}
          </div>

          {/* Vitals + devices */}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {data.vitals.map((v) => (
              <div key={v.label} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted">{v.label}</div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className={`tnum text-lg font-semibold ${v.tone ? LEVEL[v.tone].text : "text-ink"}`}>{v.value}</span>
                  {v.unit && <span className="text-[11px] text-muted">{v.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        </MotionCard>

        {/* Device status strip */}
        <MotionCard className="p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            <Cpu size={14} className="text-primary" /> Paired devices
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {data.devices.map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <div>
                  <div className="text-[13px] font-medium text-ink">{d.name}</div>
                  <div className="text-[10px] text-muted">{d.type}</div>
                </div>
                <div className="text-right">
                  <span className={`flex items-center gap-1.5 text-[11px] font-medium ${d.status === "online" ? "text-good-ink" : "text-muted"}`}>
                    <span className={`h-2 w-2 rounded-full ${d.status === "online" ? "bg-good" : "bg-muted"}`} />
                    {d.status}
                  </span>
                  <span className="tnum text-[10px] text-muted">{d.battery}</span>
                </div>
              </div>
            ))}
          </div>
        </MotionCard>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <Segmented options={TABS} value={tab} onChange={setTab} size="sm" />
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {tab === "overview" && <Overview data={data} />}
          {tab === "sessions" && <Sessions data={data} />}
          {tab === "pressure" && <Pressure data={data} />}
          {tab === "reports" && <Reports data={data} />}
          {tab === "history" && <History data={data} />}
        </motion.div>
      </div>
    </AppShell>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof UserRound; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={13} className="text-muted" /> {text}
    </span>
  );
}

function Overview({ data }: { data: PatientDetailData }) {
  return (
    <Stagger className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <MotionCard className="xl:col-span-2">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">30-Day Risk Index</h3>
          <p className="text-[11px] text-muted">Daily average fall-risk score</p>
        </div>
        <div className="p-4">
          <AreaTrend data={data.riskHistory} unit="%" domain={[0, 100]} height={240} />
        </div>
      </MotionCard>

      <MotionCard>
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Activity Timeline</h3>
        </div>
        <div className="max-h-[300px] space-y-0 overflow-auto p-4">
          {data.timeline.map((e, i) => (
            <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${e.level ? "" : "bg-primary"}`} style={e.level ? { background: LEVEL[e.level].color } : undefined} />
                {i < data.timeline.length - 1 && <span className="w-px flex-1 bg-line" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-ink">{e.title}</div>
                <div className="text-[11px] text-ink-secondary">{e.detail}</div>
                <div className="text-[10px] text-muted">{e.t}</div>
              </div>
            </div>
          ))}
        </div>
      </MotionCard>
    </Stagger>
  );
}

function Sessions({ data }: { data: PatientDetailData }) {
  return (
    <MotionCard>
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Walking Sessions</h3>
        <p className="text-[11px] text-muted">Recorded gait assessments</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-muted">
            <th className="px-5 py-2.5 font-medium">Date</th>
            <th className="px-5 py-2.5 font-medium">Duration</th>
            <th className="px-5 py-2.5 font-medium">Steps</th>
            <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Cadence</th>
            <th className="hidden px-5 py-2.5 font-medium sm:table-cell">Symmetry</th>
            <th className="px-5 py-2.5 font-medium">Peak</th>
          </tr>
        </thead>
        <tbody>
          {data.sessions.map((s) => (
            <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-surface-2">
              <td className="px-5 py-3 text-ink">{s.date}</td>
              <td className="tnum px-5 py-3 text-ink-secondary">{s.duration}</td>
              <td className="tnum px-5 py-3 text-ink-secondary">{s.steps.toLocaleString()}</td>
              <td className="tnum hidden px-5 py-3 text-ink-secondary sm:table-cell">{s.avgCadence} spm</td>
              <td className="tnum hidden px-5 py-3 text-ink-secondary sm:table-cell">{s.symmetry}%</td>
              <td className="px-5 py-3"><StatusPill level={s.peak} size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </MotionCard>
  );
}

function Pressure({ data }: { data: PatientDetailData }) {
  return (
    <MotionCard>
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Plantar Pressure History</h3>
        <p className="text-[11px] text-muted">Mean pressure-asymmetry index · 14 days</p>
      </div>
      <div className="p-4">
        <AreaTrend data={data.pressureHistory} color="var(--accent)" unit="%" domain={[0, 100]} height={280} />
      </div>
    </MotionCard>
  );
}

function Reports({ data }: { data: PatientDetailData }) {
  return (
    <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {data.reports.map((r) => (
        <Link key={r.id} href={`/reports/${r.id}`}>
          <MotionCard className="p-5">
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <FileText size={18} />
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${r.status === "final" ? "bg-good/10 text-good-ink" : "bg-warning/10 text-warning-ink"}`}>
                {r.status}
              </span>
            </div>
            <div className="mt-3 font-medium text-ink">{r.title}</div>
            <div className="text-[11px] text-muted">{r.date}</div>
            <div className="mt-3"><StatusPill level={r.peak} size="sm" /></div>
          </MotionCard>
        </Link>
      ))}
    </Stagger>
  );
}

function History({ data }: { data: PatientDetailData }) {
  if (data.history.length === 0) {
    return <MotionCard className="p-0"><EmptyState icon={AlertTriangle} title="No medical history" /></MotionCard>;
  }
  return (
    <MotionCard className="p-5">
      <div className="space-y-4">
        {data.history.map((h, i) => (
          <div key={i} className="flex gap-4">
            <div className="tnum w-14 shrink-0 text-[13px] font-semibold text-primary">{h.date}</div>
            <div className="border-l border-line pl-4">
              <div className="text-[13px] font-medium text-ink">{h.title}</div>
              <div className="text-[12px] text-ink-secondary">{h.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </MotionCard>
  );
}
