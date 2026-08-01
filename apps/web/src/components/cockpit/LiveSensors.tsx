"use client";

import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { useLiveStore } from "@/lib/store";
import { useSampled } from "@/hooks/useSampled";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { Stat } from "@/components/ui/Stat";
import { Gauge } from "lucide-react";

/**
 * Live sensor readouts. Charts subscribe to the 12.5 Hz buffer; the slower
 * pose-derived metric tiles are sampled at 2 Hz so they don't churn.
 */
export function LiveSensors() {
  const buf = useLiveStore((s) => s.sensorBuf);
  const metrics = useSampled(
    () => useLiveStore.getState().latestPose?.metrics ?? null,
    250
  );

  const last = buf[buf.length - 1];

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Live Sensors"
        icon={<Gauge size={14} />}
        right={
          <span className="tnum text-[10px] text-muted">
            50 Hz insole · 30 Hz vision
          </span>
        }
      />
      <PanelBody className="flex-1 space-y-4">
        {/* Plantar load L vs R — two categorical series, asymmetry at a glance */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-ink-secondary">
              Plantar load (L / R)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <Legend color="var(--s-1)" label="Left" value={last?.loadL} />
              <Legend color="var(--s-2)" label="Right" value={last?.loadR} />
            </div>
          </div>
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={buf} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                <YAxis domain={[0, 3]} hide />
                <Line
                  type="monotone"
                  dataKey="loadL"
                  stroke="var(--s-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="loadR"
                  stroke="var(--s-2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* IMU sway / instability — single series */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-ink-secondary">
              IMU instability (sway)
            </span>
            <span className="tnum text-[10px] text-muted">
              {last ? last.sway.toFixed(2) : "—"} g·eq
            </span>
          </div>
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={buf} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id="swayFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--vital)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--vital)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 1.5]} hide />
                <Area
                  type="monotone"
                  dataKey="sway"
                  stroke="var(--vital)"
                  strokeWidth={2}
                  fill="url(#swayFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vision-derived gait metrics */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Cadence"
            value={metrics ? Math.round(metrics.cadence) : "—"}
            unit="spm"
          />
          <Stat
            label="Step sym."
            value={metrics ? Math.round(metrics.stepLengthSym * 100) : "—"}
            unit="%"
            tone={symTone(metrics?.stepLengthSym)}
          />
          <Stat
            label="Arm swing"
            value={metrics ? Math.round(metrics.armSwingSym * 100) : "—"}
            unit="%"
            tone={symTone(metrics?.armSwingSym)}
          />
          <Stat
            label="Dbl support"
            value={metrics ? metrics.doubleSupport.toFixed(0) : "—"}
            unit="%"
            tone={metrics && metrics.doubleSupport > 28 ? "warning" : "default"}
          />
        </div>
      </PanelBody>
    </Panel>
  );
}

function symTone(v?: number): "default" | "warning" | "critical" {
  if (v == null) return "default";
  if (v < 0.5) return "critical";
  if (v < 0.7) return "warning";
  return "default";
}

function Legend({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-secondary">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
      <span className="tnum text-muted">{value != null ? value.toFixed(2) : "—"}</span>
    </span>
  );
}
