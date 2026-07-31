"use client";

import { useLiveStore } from "@/lib/store";
import { useSampled } from "@/hooks/useSampled";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { BarChart3 } from "lucide-react";

/** Per-sensor plantar load and overall left/right balance. */
export function FootPressureDistribution() {
  const frame = useSampled(() => useLiveStore.getState().latestInsole, 120);
  const L = frame?.fsr.left ?? [0, 0, 0, 0];
  const R = frame?.fsr.right ?? [0, 0, 0, 0];
  const totalL = L.reduce((a, b) => a + b, 0);
  const totalR = R.reduce((a, b) => a + b, 0);
  const sum = totalL + totalR || 1;
  const leftPct = Math.round((totalL / sum) * 100);
  const rightPct = 100 - leftPct;
  const zones = ["Heel", "Lateral", "Medial", "Toe"];

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Foot Pressure Distribution" icon={<BarChart3 size={14} />} />
      <PanelBody className="flex-1 space-y-4">
        {/* L/R balance */}
        <div>
          <div className="mb-1.5 flex justify-between text-[11px] text-ink-secondary">
            <span>Left {leftPct}%</span>
            <span>Right {rightPct}%</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full transition-all duration-150" style={{ width: `${leftPct}%`, background: "var(--s-1)" }} />
            <div className="h-full transition-all duration-150" style={{ width: `${rightPct}%`, background: "var(--s-2)" }} />
          </div>
          <div className="mt-1 text-center text-[10px] text-muted">
            {Math.abs(leftPct - 50) < 6 ? "Balanced" : leftPct > 50 ? "Left-dominant load" : "Right-dominant load"}
          </div>
        </div>

        {/* Per-zone bars */}
        <div className="grid grid-cols-2 gap-3">
          {[["L", L], ["R", R]].map(([side, vals]) => (
            <div key={side as string}>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
                {side === "L" ? "Left" : "Right"}
              </div>
              <div className="flex h-24 items-end gap-1.5">
                {(vals as number[]).map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-full w-full items-end rounded-md bg-surface-2">
                      <div
                        className="w-full rounded-md transition-all duration-150"
                        style={{ height: `${Math.min(100, v * 100)}%`, background: side === "L" ? "var(--s-1)" : "var(--s-2)" }}
                      />
                    </div>
                    <span className="text-[8px] text-muted">{zones[i].slice(0, 4)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PanelBody>
    </Panel>
  );
}
