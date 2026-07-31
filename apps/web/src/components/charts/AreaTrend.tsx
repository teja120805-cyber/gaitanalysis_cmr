"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** A themed single-series area chart with a soft brand gradient fill. */
export function AreaTrend({
  data,
  dataKey = "value",
  xKey = "label",
  color = "var(--primary)",
  height = 260,
  domain,
  unit = "",
}: {
  data: Record<string, unknown>[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  domain?: [number, number];
  unit?: string;
}) {
  const gid = `grad-${dataKey}-${color.replace(/[^a-z]/gi, "")}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={domain}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)" }}
            formatter={(v: number) => [`${v}${unit}`, ""]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gid})`}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
