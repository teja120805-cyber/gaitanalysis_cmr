"use client";

import { useLiveStore } from "@/lib/store";
import { LEVEL } from "@/lib/risk";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { clock } from "@/lib/utils";
import { AlertTriangle, BellRing, Check } from "lucide-react";

export function AlertsFeed() {
  const alerts = useLiveStore((s) => s.alerts);
  const ack = useLiveStore((s) => s.ackAlert);
  const open = alerts.filter((a) => a.status === "open").length;

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Alerts"
        icon={<BellRing size={14} />}
        right={
          <span className="tnum rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-secondary">
            {open} open
          </span>
        }
      />
      <PanelBody className="flex-1 space-y-2 overflow-auto">
        {alerts.length === 0 && (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-muted">
            <Check size={20} className="text-good" />
            <span className="text-xs">No alerts — patient stable</span>
          </div>
        )}
        {alerts.map((a) => {
          const meta = LEVEL[a.level];
          return (
            <div
              key={a.id}
              className="animate-fade-in rounded-lg border border-line bg-surface-2 p-2.5"
              style={{ borderLeft: `3px solid ${meta.color}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} style={{ color: meta.color }} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[13px] font-medium text-ink">{a.title}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-ink-secondary">
                      {a.detail}
                    </div>
                    <div className="tnum mt-1 text-[10px] text-muted">
                      {clock(new Date(a.t))}
                    </div>
                  </div>
                </div>
                {a.status === "open" ? (
                  <button
                    onClick={() => ack(a.id)}
                    className="shrink-0 rounded-md border border-line px-2 py-1 text-[10px] font-medium text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
                  >
                    Ack
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-good">
                    <Check size={12} /> Acked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </PanelBody>
    </Panel>
  );
}
