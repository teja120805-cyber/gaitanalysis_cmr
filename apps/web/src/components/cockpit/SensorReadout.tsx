"use client";

import { useLiveStore } from "@/lib/store";
import { useSampled } from "@/hooks/useSampled";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { LEVEL } from "@/lib/risk";
import { Cpu } from "lucide-react";

/** Raw live sensor values: 4 FSR per foot, 6-axis IMU, and the fused risk score. */
export function SensorReadout() {
  const frame = useSampled(() => useLiveStore.getState().latestInsole, 60);
  const risk = useLiveStore((s) => s.latestRisk);
  const level = risk?.level ?? "normal";

  const L = frame?.fsr.left ?? [0, 0, 0, 0];
  const R = frame?.fsr.right ?? [0, 0, 0, 0];
  const imu = frame?.imu;

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Live Sensor Values"
        icon={<Cpu size={14} />}
        right={<span className="tnum text-[10px] text-muted">ESP32 · 50 Hz</span>}
      />
      <PanelBody className="flex-1 space-y-3">
        {/* FSR grid */}
        <div className="grid grid-cols-2 gap-3">
          <FsrColumn label="Left foot" values={L} />
          <FsrColumn label="Right foot" values={R} />
        </div>

        {/* IMU */}
        <div className="grid grid-cols-2 gap-3">
          <AxisBlock
            title="Accelerometer"
            unit="g"
            axes={[
              ["X", imu?.ax ?? 0],
              ["Y", imu?.ay ?? 0],
              ["Z", imu?.az ?? 0],
            ]}
          />
          <AxisBlock
            title="Gyroscope"
            unit="°/s"
            axes={[
              ["X", imu?.gx ?? 0],
              ["Y", imu?.gy ?? 0],
              ["Z", imu?.gz ?? 0],
            ]}
          />
        </div>

        {/* Risk score */}
        <div
          className="flex items-center justify-between rounded-xl border px-4 py-3"
          style={{ borderColor: `${LEVEL[level].color}44`, background: `${LEVEL[level].color}12` }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            Risk score
          </span>
          <span className="tnum text-2xl font-semibold" style={{ color: LEVEL[level].color }}>
            {Math.round((risk?.score ?? 0) * 100)}
          </span>
        </div>
      </PanelBody>
    </Panel>
  );
}

function FsrColumn({ label, values }: { label: string; values: number[] | readonly number[] }) {
  const names = ["FSR1 · heel", "FSR2 · lat", "FSR3 · med", "FSR4 · toe"];
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-2.5">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className="space-y-1.5">
        {names.map((n, i) => {
          const v = values[i] ?? 0;
          return (
            <div key={n} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[10px] text-ink-secondary">{n}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, v * 100)}%` }} />
              </div>
              <span className="tnum w-9 shrink-0 text-right text-[10px] text-ink">{v.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AxisBlock({ title, unit, axes }: { title: string; unit: string; axes: [string, number][] }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">{title}</span>
        <span className="text-[9px] text-muted">{unit}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {axes.map(([ax, val]) => (
          <div key={ax} className="rounded-lg bg-surface px-1.5 py-1 text-center">
            <div className="text-[9px] text-muted">{ax}</div>
            <div className="tnum text-[12px] font-semibold text-ink">{val.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
