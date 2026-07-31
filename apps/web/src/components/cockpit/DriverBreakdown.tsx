"use client";

import { useLiveStore } from "@/lib/store";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import type { RiskDriver } from "@/lib/types";
import { Layers } from "lucide-react";

// Identity by data source — categorical slots, fixed order.
const SOURCE: Record<RiskDriver["source"], { label: string; color: string }> = {
  insole: { label: "Insole", color: "var(--s-1)" },
  vision: { label: "Vision", color: "var(--s-3)" },
  fusion: { label: "Fusion", color: "var(--s-2)" },
};

/**
 * Explainability panel: which features drove the current score, and from which
 * stream. This is the "why" that separates a medical tool from a black box — and
 * it visibly demonstrates that both streams contribute (data fusion).
 */
export function DriverBreakdown() {
  const risk = useLiveStore((s) => s.latestRisk);
  const drivers = risk?.drivers ?? [];
  const max = Math.max(0.01, ...drivers.map((d) => d.weight));

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Risk Drivers"
        icon={<Layers size={14} />}
        right={
          <div className="flex items-center gap-3">
            {Object.values(SOURCE).map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[10px] text-ink-secondary">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.label}
              </span>
            ))}
          </div>
        }
      />
      <PanelBody className="flex-1 space-y-2.5">
        {drivers.map((d) => {
          const pct = (d.weight / max) * 100;
          const src = SOURCE[d.source];
          return (
            <div key={d.key}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-ink-secondary">{d.label}</span>
                <span className="tnum text-muted">
                  {(d.weight * 100).toFixed(0)} pts
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: src.color,
                    transition: "width 0.45s ease-out",
                  }}
                />
              </div>
            </div>
          );
        })}
        {drivers.length === 0 && (
          <div className="py-8 text-center text-xs text-muted">
            Awaiting first fused assessment…
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
