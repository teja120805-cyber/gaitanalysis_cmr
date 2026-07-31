"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MotionCard } from "@/components/ui/motion";
import { Segmented } from "@/components/ui/Segmented";

const WEEKLY = [
  { label: "Mon", sessions: 12, alerts: 3 },
  { label: "Tue", sessions: 15, alerts: 2 },
  { label: "Wed", sessions: 11, alerts: 5 },
  { label: "Thu", sessions: 18, alerts: 4 },
  { label: "Fri", sessions: 16, alerts: 1 },
  { label: "Sat", sessions: 7, alerts: 2 },
  { label: "Sun", sessions: 6, alerts: 1 },
];
const MONTHLY = Array.from({ length: 12 }, (_, i) => ({
  label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  sessions: 40 + Math.round(Math.sin(i) * 18 + i * 2),
  alerts: 8 + Math.round(Math.cos(i) * 5 + 3),
}));

export function AnalyticsCard() {
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");
  const data = mode === "weekly" ? WEEKLY : MONTHLY;

  return (
    <MotionCard className="xl:col-span-2">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Session & Alert Analytics</h3>
          <p className="text-[11px] text-muted">Assessments and alerts over time</p>
        </div>
        <Segmented
          options={[{ label: "Weekly", value: "weekly" }, { label: "Monthly", value: "monthly" }]}
          value={mode}
          onChange={setMode}
          size="sm"
        />
      </div>
      <div className="p-4">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={4}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip cursor={{ fill: "var(--surface-2)" }} />
              <Bar dataKey="sessions" name="Sessions" fill="var(--s-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="alerts" name="Alerts" fill="var(--s-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-secondary">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-s-1" /> Sessions</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-s-2" /> Alerts</span>
        </div>
      </div>
    </MotionCard>
  );
}
