"use client";

import { Activity } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { Sparkline } from "@/components/overview/Sparkline";
import { useGaitVitals, type VitalKey } from "@/hooks/useGaitVitals";

const TILES: {
  k: VitalKey;
  title: string;
  sub: string;
  unit: string;
  color: string;
  dec: number;
}[] = [
  { k: "stride", title: "Stride Variability", sub: "Coefficient of variation", unit: "%", color: "#eb6834", dec: 2 },
  { k: "cadence", title: "Cadence", sub: "Steps per minute", unit: " spm", color: "#2a78d6", dec: 0 },
  { k: "symmetry", title: "Pressure Symmetry", sub: "L/R balance index", unit: "%", color: "#1baf7a", dec: 0 },
  { k: "cop", title: "Center of Pressure", sub: "Sway path length", unit: " cm", color: "#38bdf8", dec: 1 },
  { k: "trunk", title: "Trunk Sway", sub: "Medio-lateral angle", unit: "°", color: "#eda100", dec: 1 },
  { k: "tremor", title: "Tremor", sub: "Hand jitter (4–6 Hz)", unit: "", color: "#e87ba4", dec: 0 },
  { k: "steps", title: "Step Count", sub: "This session", unit: "", color: "#4a3aa7", dec: 0 },
];

export function LiveGaitMetrics() {
  const v = useGaitVitals();

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Live Gait Metrics"
        icon={<Activity size={14} />}
        right={
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-good-ink">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
            </span>
            LIVE
          </span>
        }
      />
      <PanelBody>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => {
            const val = v[t.k];
            const hist = v.h[t.k];
            return (
              <div key={t.k} className="rounded-xl border border-line bg-surface-2 p-3">
                <div className="text-[12px] font-semibold leading-tight text-ink">{t.title}</div>
                <div className="text-[10px] text-muted">{t.sub}</div>
                <div className="mt-1.5 flex items-baseline gap-0.5">
                  <span className="tnum text-[22px] font-semibold leading-none text-ink">
                    {val.toFixed(t.dec)}
                  </span>
                  <span className="text-[11px] text-muted">{t.unit}</span>
                </div>
                <div className="mt-1.5 h-[30px] overflow-hidden">
                  <Sparkline data={hist.length > 1 ? hist : [val, val]} color={t.color} width={140} height={30} />
                </div>
              </div>
            );
          })}
        </div>
      </PanelBody>
    </Panel>
  );
}
