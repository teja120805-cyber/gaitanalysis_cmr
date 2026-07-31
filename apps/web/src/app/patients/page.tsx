"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, LayoutGrid, List, Search, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { MotionCard, Stagger } from "@/components/ui/motion";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkline } from "@/components/overview/Sparkline";
import { PATIENTS } from "@/lib/patients";
import { LEVEL } from "@/lib/risk";
import type { RiskLevel } from "@/lib/types";

function trend(seed: string, baseline: RiskLevel): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  const base = baseline === "high" ? 0.62 : baseline === "mild" ? 0.42 : 0.2;
  return Array.from({ length: 16 }, (_, i) => {
    h = (h * 17 + 43) % 997;
    return Math.max(0.05, Math.min(0.95, base + (h / 997 - 0.5) * 0.26 + i * 0.004));
  });
}

const FILTERS = [
  { label: "All", value: "all" as const },
  { label: "High", value: "high" as const },
  { label: "Mild", value: "mild" as const },
  { label: "Normal", value: "normal" as const },
];

export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return PATIENTS.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q);
      const matchesF = filter === "all" || p.baselineRisk === filter;
      return matchesQ && matchesF;
    });
  }, [query, filter]);

  return (
    <AppShell title="Patients" subtitle="Directory · gait & fall-risk monitoring">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card lg:w-96">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or MRN…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Segmented options={FILTERS} value={filter} onChange={setFilter} size="sm" />
            <div className="hidden items-center gap-1 rounded-xl border border-line bg-surface-2 p-0.5 sm:flex">
              <IconToggle active={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={15} /></IconToggle>
              <IconToggle active={view === "list"} onClick={() => setView("list")}><List size={15} /></IconToggle>
            </div>
            <Button size="sm" className="hidden sm:inline-flex">
              <UserPlus size={15} /> Add patient
            </Button>
          </div>
        </div>

        {view === "grid" ? (
          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => {
              const meta = LEVEL[p.baselineRisk];
              return (
                <MotionCard key={p.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <Link href={`/patients/${p.id}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                      <span className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold text-white">
                        {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                      <div>
                        <div className="font-semibold text-ink">{p.name}</div>
                        <div className="tnum text-[11px] text-muted">{p.mrn} · {p.age}y {p.sex}</div>
                      </div>
                    </Link>
                    <StatusPill level={p.baselineRisk} size="sm" />
                  </div>

                  <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3">
                    <div className="text-[11px] text-ink-secondary">{p.condition}</div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted">7-day trend</div>
                      <Sparkline data={trend(p.id, p.baselineRisk)} color={meta.color} width={110} height={32} />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted">Room</div>
                      <div className="text-[12px] font-medium text-ink">{p.room}</div>
                    </div>
                  </div>

                  <Link href={`/monitor/${p.id}`} className="mt-4 block">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Activity size={14} className="text-primary" /> Open live monitor
                    </Button>
                  </Link>
                </MotionCard>
              );
            })}
          </Stagger>
        ) : (
          <MotionCard>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Room</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Condition</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Trend</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const meta = LEVEL[p.baselineRisk];
                  return (
                    <tr key={p.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <Link href={`/patients/${p.id}`} className="font-medium text-ink hover:text-primary">{p.name}</Link>
                        <div className="tnum text-[11px] text-muted">{p.mrn} · {p.age}y {p.sex}</div>
                      </td>
                      <td className="px-5 py-3 text-ink-secondary">{p.room}</td>
                      <td className="hidden max-w-[260px] px-5 py-3 text-[12px] text-ink-secondary lg:table-cell">{p.condition}</td>
                      <td className="px-5 py-3"><StatusPill level={p.baselineRisk} size="sm" /></td>
                      <td className="hidden px-5 py-3 md:table-cell"><Sparkline data={trend(p.id, p.baselineRisk)} color={meta.color} /></td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/monitor/${p.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink-secondary transition-colors hover:border-primary/40 hover:text-ink">
                          <Activity size={13} className="text-primary" /> Monitor
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </MotionCard>
        )}

        {filtered.length === 0 && (
          <MotionCard className="mt-4">
            <EmptyState
              icon={Users}
              title="No patients found"
              detail="No patients match your current search or filter. Try adjusting them."
            />
          </MotionCard>
        )}
      </div>
    </AppShell>
  );
}

function IconToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink-secondary"
      }`}
    >
      {children}
    </button>
  );
}
