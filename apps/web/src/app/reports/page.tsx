"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MotionCard, Stagger } from "@/components/ui/motion";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import type { RiskLevel } from "@/lib/types";

interface Report {
  id: string;
  patient: string;
  mrn: string;
  type: string;
  date: string;
  peak: RiskLevel;
  duration: string;
  status: "final" | "draft";
}

const REPORTS: Report[] = [
  { id: "rep-pt-3390-1", patient: "Priya Nadar", mrn: "MRN-3390", type: "Fall-risk assessment", date: "26 Jul 2026", peak: "high", duration: "18 min", status: "final" },
  { id: "rep-pt-1042-1", patient: "Eleanor Whitfield", mrn: "MRN-1042", type: "Gait analysis · Parkinson's", date: "26 Jul 2026", peak: "mild", duration: "32 min", status: "final" },
  { id: "rep-pt-4415-1", patient: "Daniel Okafor", mrn: "MRN-4415", type: "Freezing episode review", date: "25 Jul 2026", peak: "mild", duration: "21 min", status: "draft" },
  { id: "rep-pt-2071-1", patient: "Marcus Bell", mrn: "MRN-2071", type: "Balance assessment", date: "24 Jul 2026", peak: "normal", duration: "27 min", status: "final" },
];

export default function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Clinical session summaries & exports">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-3">
            <Stat label="Total reports" value="124" />
            <Stat label="This week" value="18" />
            <Stat label="Pending review" value="3" tone="warning" />
          </div>
          <Button size="sm">
            <Plus size={15} /> Generate report
          </Button>
        </div>

        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((r) => (
            <MotionCard key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <FileText size={20} />
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    r.status === "final" ? "bg-good/10 text-good-ink" : "bg-warning/10 text-warning-ink"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="font-semibold text-ink">{r.patient}</div>
                <div className="tnum text-[11px] text-muted">{r.mrn}</div>
              </div>
              <div className="mt-2 text-[13px] text-ink-secondary">{r.type}</div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface-2 p-3 text-[11px]">
                <div>
                  <div className="text-muted">Session date</div>
                  <div className="font-medium text-ink">{r.date}</div>
                </div>
                <div>
                  <div className="text-muted">Duration</div>
                  <div className="tnum font-medium text-ink">{r.duration}</div>
                </div>
                <div className="text-right">
                  <div className="mb-1 text-muted">Peak</div>
                  <StatusPill level={r.peak} size="sm" />
                </div>
              </div>

              <Link href={`/reports/${r.id}`} className="mt-4 block">
                <Button variant="secondary" size="sm" className="w-full">
                  <FileText size={14} className="text-primary" /> Open report
                </Button>
              </Link>
            </MotionCard>
          ))}
        </Stagger>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-2 shadow-card">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`tnum text-lg font-semibold ${tone === "warning" ? "text-warning-ink" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
