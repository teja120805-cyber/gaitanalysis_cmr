"use client";

import { BatteryLow, Cpu, Wifi, WifiOff } from "lucide-react";
import { MotionCard } from "@/components/ui/motion";

const DEVICES = [
  { name: "Insole fleet", online: 22, total: 24 },
  { name: "Vision cameras", online: 5, total: 6 },
];

const ATTENTION = [
  { name: "ESP32-B7 · M. Bell", issue: "Battery 12%", icon: BatteryLow, tone: "text-warning-ink" },
  { name: "Cam Rehab-2 · D. Okafor", issue: "Offline 4m", icon: WifiOff, tone: "text-critical-ink" },
];

export function DeviceStatusCard() {
  return (
    <MotionCard>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Device Status</h3>
        <span className="flex items-center gap-1.5 rounded-full bg-good/10 px-2.5 py-1 text-[11px] font-semibold text-good-ink">
          <Wifi size={12} /> 27 / 30 online
        </span>
      </div>
      <div className="space-y-3 p-4">
        {DEVICES.map((d) => {
          const pct = Math.round((d.online / d.total) * 100);
          return (
            <div key={d.name}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-ink-secondary"><Cpu size={13} className="text-primary" /> {d.name}</span>
                <span className="tnum text-muted">{d.online}/{d.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-good" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}

        <div className="pt-1">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Needs attention</div>
          <div className="space-y-2">
            {ATTENTION.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.name} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
                  <span className="text-[12px] text-ink">{a.name}</span>
                  <span className={`flex items-center gap-1 text-[11px] font-medium ${a.tone}`}>
                    <Icon size={13} /> {a.issue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MotionCard>
  );
}
