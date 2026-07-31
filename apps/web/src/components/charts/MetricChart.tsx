"use client";

import { useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { MotionCard } from "@/components/ui/motion";
import { exportSvgAsPng } from "@/lib/exportChart";

/**
 * A self-contained analytics metric card. Uses concrete hex colors (not CSS vars)
 * so the PNG export renders faithfully. Fixed muted axis colors read on both
 * light and dark surfaces.
 */
export function MetricChart({
  title,
  subtitle,
  data,
  color,
  unit = "",
  domain,
}: {
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
  color: string;
  unit?: string;
  domain?: [number, number];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const gid = `m-${title.replace(/[^a-z]/gi, "")}`;
  const latest = data[data.length - 1]?.value ?? 0;
  const first = data[0]?.value ?? 0;
  const delta = latest - first;

  return (
    <MotionCard className="p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          <div className="text-[10px] text-muted">{subtitle}</div>
        </div>
        <button
          onClick={() => exportSvgAsPng(ref.current, title.toLowerCase().replace(/\s+/g, "-"))}
          className="rounded-lg border border-line bg-surface-2 p-1.5 text-muted transition-colors hover:text-ink"
          title="Export PNG"
        >
          <Download size={13} />
        </button>
      </div>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="tnum text-2xl font-semibold text-ink">
          {latest}
          <span className="text-sm text-muted">{unit}</span>
        </span>
        <span className={`text-[11px] font-medium ${delta >= 0 ? "text-good-ink" : "text-critical-ink"}`}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(0)}
          {unit} vs start
        </span>
      </div>

      <div ref={ref} className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis domain={domain} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              contentStyle={{ background: "#0f1826", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 10, color: "#fff", fontSize: 12 }}
              formatter={(v: number) => [`${v}${unit}`, title]}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gid})`} isAnimationActive animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MotionCard>
  );
}
