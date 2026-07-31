"use client";

import {
  Area,
  AreaChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { useLiveStore } from "@/lib/store";
import { LEVEL, levelFromScore } from "@/lib/risk";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { Activity } from "lucide-react";

/** Risk score over the session — single series, with the three bands shaded. */
export function RiskTimeline() {
  const buf = useLiveStore((s) => s.riskBuf);
  const last = buf[buf.length - 1];
  const level = last ? levelFromScore(last.score) : "normal";
  const color = LEVEL[level].color;

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Risk Timeline"
        icon={<Activity size={14} />}
        right={
          <span className="tnum text-[10px] text-muted">
            last {Math.min(buf.length, 360) / 2 | 0}s · 2 Hz
          </span>
        }
      />
      <PanelBody className="flex-1">
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buf} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 1]} hide />
              {/* Band shading — reserved status hues at low opacity */}
              <ReferenceArea y1={0} y2={0.33} fill="var(--status-good)" fillOpacity={0.05} />
              <ReferenceArea y1={0.33} y2={0.66} fill="var(--status-warning)" fillOpacity={0.05} />
              <ReferenceArea y1={0.66} y2={1} fill="var(--status-critical)" fillOpacity={0.06} />
              <ReferenceLine y={0.33} stroke="var(--muted)" strokeDasharray="2 4" strokeOpacity={0.5} />
              <ReferenceLine y={0.66} stroke="var(--muted)" strokeDasharray="2 4" strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2}
                fill="url(#riskFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </PanelBody>
    </Panel>
  );
}
