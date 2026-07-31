"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Printer,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { AreaTrend } from "@/components/charts/AreaTrend";
import { LEVEL } from "@/lib/risk";
import type { ReportData } from "@/lib/reportData";

const FLAG = {
  normal: { cls: "text-good-ink bg-good/10", label: "Normal" },
  borderline: { cls: "text-warning-ink bg-warning/10", label: "Borderline" },
  abnormal: { cls: "text-critical-ink bg-critical/10", label: "Abnormal" },
};

export function ReportView({ report }: { report: ReportData }) {
  const { toast } = useToast();
  const meta = LEVEL[report.peak];

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value", "Normal range", "Flag"],
      ...report.gait.map((g) => [g.metric, g.value, g.normal, g.flag]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ tone: "success", title: "CSV exported", detail: `${report.id}.csv downloaded` });
  };

  return (
    <AppShell title="Report" subtitle={`${report.patient.name} · ${report.title}`}>
      <div className="print-area mx-auto max-w-[900px] p-4 sm:p-6">
        {/* Action bar (hidden in print) */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-ink-secondary">
            Report ID · {report.id}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <FileSpreadsheet size={15} /> CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toast({ tone: "info", title: "Preparing PDF…", detail: "Choose “Save as PDF” in the print dialog" });
                setTimeout(() => window.print(), 400);
              }}
            >
              <Download size={15} /> PDF
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </Button>
          </div>
        </div>

        {/* The report sheet */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="print-sheet rounded-2xl border border-line bg-white p-8 text-[#0f1b2d] shadow-card sm:p-10"
        >
          {/* Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-[#0f1b2d]/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#0d9488] text-white">
                <Waves size={22} />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">GaitGuard Medical</div>
                <div className="text-[11px] text-[#475569]">Neurology · Gait & Fall-Risk Laboratory</div>
              </div>
            </div>
            <div className="text-right text-[11px] text-[#475569]">
              <div className="font-semibold text-[#0f1b2d]">CONFIDENTIAL</div>
              <div>Report date: {report.date}</div>
              <div>{report.clinician}</div>
            </div>
          </div>

          <h1 className="mt-6 text-xl font-bold">{report.title}</h1>
          <p className="text-[12px] text-[#475569]">{report.type}</p>

          {/* Patient info */}
          <Section title="Patient Information">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[13px] sm:grid-cols-3">
              <Info label="Name" value={report.patient.name} />
              <Info label="MRN" value={report.patient.mrn} />
              <Info label="Age / Sex" value={`${report.patient.age} · ${report.patient.sex === "F" ? "Female" : "Male"}`} />
              <Info label="Room" value={report.patient.room} />
              <Info label="Diagnosis" value={report.patient.condition} />
              <Info label="Assigned clinician" value={report.clinician} />
            </div>
          </Section>

          {/* Risk score banner */}
          <div className="mt-6 flex items-center justify-between rounded-xl border p-4" style={{ borderColor: `${meta.color}55`, background: `${meta.color}12` }}>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#475569]">Overall fall-risk</div>
              <div className="text-2xl font-bold" style={{ color: meta.color }}>{meta.label}</div>
            </div>
            <div className="text-right">
              <div className="tnum text-3xl font-bold" style={{ color: meta.color }}>{report.score}<span className="text-base text-[#475569]">/100</span></div>
              <div className="text-[11px] text-[#475569]">Model confidence {report.confidence}%</div>
            </div>
          </div>

          {/* Session summary */}
          <Section title="Walking Session Summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Duration" value={report.session.duration} />
              <Metric label="Steps" value={report.session.steps.toLocaleString()} />
              <Metric label="Distance" value={report.session.distance} />
              <Metric label="Falls" value={String(report.session.falls)} />
            </div>
          </Section>

          {/* Pressure analysis */}
          <Section title="Pressure Analysis">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]">
              <div>
                <div className="mb-1.5 flex justify-between text-[12px] text-[#475569]">
                  <span>Left {report.pressure.leftPct}%</span>
                  <span>Right {report.pressure.rightPct}%</span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full">
                  <div style={{ width: `${report.pressure.leftPct}%`, background: "#2a78d6" }} />
                  <div style={{ width: `${report.pressure.rightPct}%`, background: "#eb6834" }} />
                </div>
                <p className="mt-2 text-[12px] text-[#475569]">Load distribution between feet. Deviation from 50/50 indicates asymmetry.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Peak pressure" value={`${report.pressure.peakKpa} kPa`} />
                <Metric label="CoP path length" value={`${report.pressure.copPathCm} cm`} />
              </div>
            </div>
          </Section>

          {/* Gait analysis table */}
          <Section title="Gait Analysis">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#0f1b2d]/10 text-left text-[11px] uppercase tracking-wide text-[#475569]">
                  <th className="py-2 font-semibold">Metric</th>
                  <th className="py-2 font-semibold">Measured</th>
                  <th className="py-2 font-semibold">Normal range</th>
                  <th className="py-2 font-semibold">Assessment</th>
                </tr>
              </thead>
              <tbody>
                {report.gait.map((g) => (
                  <tr key={g.metric} className="border-b border-[#0f1b2d]/6">
                    <td className="py-2 font-medium">{g.metric}</td>
                    <td className="tnum py-2">{g.value}</td>
                    <td className="py-2 text-[#475569]">{g.normal}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${FLAG[g.flag].cls}`}>{FLAG[g.flag].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Abnormalities */}
          <Section title="Detected Abnormalities">
            <div className="space-y-2">
              {report.abnormalities.map((a) => (
                <div key={a.title} className="flex items-start gap-3 rounded-lg border border-[#0f1b2d]/8 p-3">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: LEVEL[a.level].color }} />
                  <div>
                    <div className="text-[13px] font-semibold">{a.title}</div>
                    <div className="text-[12px] text-[#475569]">{a.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Trend graphs */}
          <Section title="Trend Graphs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TrendBox title="Fall-risk index (12 wk)" icon={<Activity size={13} />}>
                <AreaTrend data={report.riskTrend} unit="%" domain={[0, 100]} height={150} color="#2563eb" />
              </TrendBox>
              <TrendBox title="Cadence (12 wk)" icon={<Activity size={13} />}>
                <AreaTrend data={report.cadenceTrend} unit="" domain={[70, 130]} height={150} color="#0d9488" />
              </TrendBox>
            </div>
          </Section>

          {/* Recommendations */}
          <Section title="Recommendations">
            <ul className="space-y-2">
              {report.recommendations.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#0d9488]" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>

          {/* Doctor notes + signature */}
          <Section title="Clinician Notes">
            <p className="text-[13px] leading-relaxed text-[#0f1b2d]">{report.notes}</p>
            <div className="mt-8 flex items-end justify-between">
              <div>
                <div className="h-10 w-56 border-b border-[#0f1b2d]/40" />
                <div className="mt-1 text-[11px] text-[#475569]">Signature · {report.clinician}</div>
              </div>
              <div className="text-right text-[11px] text-[#475569]">
                <div>Generated by GaitGuard AI</div>
                <div>{report.date}</div>
              </div>
            </div>
          </Section>

          <div className="mt-8 border-t border-[#0f1b2d]/10 pt-3 text-center text-[10px] text-[#8695a8]">
            This report is generated from continuous insole + vision monitoring and AI risk fusion. For clinical use in
            conjunction with physician judgment. © 2026 GaitGuard Medical.
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563eb]">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[#8695a8]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#0f1b2d]/8 bg-[#f7f9fc] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[#8695a8]">{label}</div>
      <div className="tnum text-base font-semibold">{value}</div>
    </div>
  );
}

function TrendBox({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#0f1b2d]/8 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#475569]">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
