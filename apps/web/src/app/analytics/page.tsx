"use client";

import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Stagger } from "@/components/ui/motion";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { MetricChart } from "@/components/charts/MetricChart";
import { useToast } from "@/components/ui/Toast";
import { apiGet } from "@/lib/api";
import { useApiData } from "@/hooks/useApiData";
import { cn } from "@/lib/utils";

type Range = "day" | "week" | "month" | "year";

const RANGES = [
  { label: "Day", value: "day" as const },
  { label: "Week", value: "week" as const },
  { label: "Month", value: "month" as const },
  { label: "Year", value: "year" as const },
];

const POINTS: Record<Range, number> = { day: 24, week: 7, month: 30, year: 12 };

function label(range: Range, i: number) {
  if (range === "day") return `${String(i).padStart(2, "0")}h`;
  if (range === "week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] ?? `D${i}`;
  if (range === "month") return `${i + 1}`;
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i] ?? `M${i}`;
}

function series(range: Range, seed: number, base: number, amp: number, drift = 0) {
  const n = POINTS[range];
  let h = seed;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) % 2147483648;
    const r = h / 2147483648;
    return {
      label: label(range, i),
      value: Math.round((base + Math.sin(i / 2) * amp + (r - 0.5) * amp + i * drift) * 10) / 10,
    };
  });
}

const METRICS = [
  { key: "stride", apiKey: "stride_variability", title: "Stride Variability", subtitle: "Coefficient of variation", color: "#eb6834", unit: "%", base: 4, amp: 2, drift: 0.05, domain: [0, 12] as [number, number] },
  { key: "cadence", apiKey: "cadence", title: "Cadence", subtitle: "Steps per minute", color: "#2a78d6", unit: "", base: 104, amp: 8, drift: -0.2, domain: [70, 130] as [number, number] },
  { key: "symmetry", apiKey: "pressure_symmetry", title: "Pressure Symmetry", subtitle: "L/R balance index", color: "#1baf7a", unit: "%", base: 88, amp: 6, drift: -0.1, domain: [60, 100] as [number, number] },
  { key: "cop", apiKey: "center_of_pressure", title: "Center of Pressure", subtitle: "Sway path length", color: "#38bdf8", unit: "cm", base: 12, amp: 4, drift: 0.08, domain: [0, 30] as [number, number] },
  { key: "trunk", apiKey: "trunk_sway", title: "Trunk Sway", subtitle: "Medio-lateral angle", color: "#eda100", unit: "°", base: 4, amp: 3, drift: 0.06, domain: [0, 14] as [number, number] },
  { key: "tremor", apiKey: "tremor", title: "Tremor", subtitle: "Hand jitter power (4–6 Hz)", color: "#e87ba4", unit: "", base: 20, amp: 12, drift: 0.2, domain: [0, 60] as [number, number] },
  { key: "steps", apiKey: "step_count", title: "Step Count", subtitle: "Steps recorded", color: "#4a3aa7", unit: "", base: 620, amp: 180, drift: 4, domain: [0, 1200] as [number, number] },
];

interface Overview {
  range: string;
  points: number;
  metrics: Record<string, number[]>;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("week");
  const { toast } = useToast();

  const { data: overview, source } = useApiData<Overview | null>(
    () => apiGet<Overview>(`/api/analytics/overview?range=${range}`),
    null,
    [range]
  );

  const charts = useMemo(
    () =>
      METRICS.map((m, i) => {
        const apiVals = overview?.metrics?.[m.apiKey];
        const data = apiVals
          ? apiVals.map((value, idx) => ({ label: label(range, idx), value }))
          : series(range, 7 + i * 13, m.base, m.amp, m.drift);
        return { ...m, data };
      }),
    [range, overview]
  );

  return (
    <AppShell title="Analytics" subtitle="Longitudinal gait & fall-risk analytics">
      <div className="mx-auto max-w-[1500px] p-4 sm:p-6">
        <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-ink-secondary">Cohort trends across the neurology ward</p>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                source === "backend" ? "bg-good/10 text-good-ink" : "bg-surface-2 text-muted"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", source === "backend" ? "bg-good" : "bg-muted")} />
              {source === "backend" ? "Live" : "Demo"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Segmented options={RANGES} value={range} onChange={setRange} size="sm" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toast({ tone: "info", title: "Preparing export…", detail: "Choose “Save as PDF” in the print dialog" });
                setTimeout(() => window.print(), 300);
              }}
            >
              <Printer size={15} /> PDF
            </Button>
            <span className="hidden items-center gap-1 text-[11px] text-muted lg:flex">
              <Download size={13} /> PNG per chart
            </span>
          </div>
        </div>

        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((c) => (
            <MetricChart
              key={c.key}
              title={c.title}
              subtitle={c.subtitle}
              data={c.data}
              color={c.color}
              unit={c.unit}
              domain={c.domain}
            />
          ))}
        </Stagger>
      </div>
    </AppShell>
  );
}
