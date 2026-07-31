"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLiveStore } from "@/lib/store";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { Activity, ArrowDownToLine, ArrowUpFromLine, ShieldAlert, Waves } from "lucide-react";

/**
 * Real-time gait-event detection off the insole stream: heel-strike and toe-off
 * from FSR threshold crossings, stride variability from pose, and a fall-
 * detection state derived from the fused risk + freezing signal.
 */
export function DetectedEvents() {
  const [state, setState] = useState({ heel: 0, toe: 0, strideVar: 0, fall: "clear" as "clear" | "watch" | "alert" });
  const flags = useRef({ heelDown: false, toeDown: false });
  const [flash, setFlash] = useState<{ heel: boolean; toe: boolean }>({ heel: false, toe: false });

  useEffect(() => {
    const id = setInterval(() => {
      const s = useLiveStore.getState();
      const f = s.latestInsole;
      const pose = s.latestPose;
      const risk = s.latestRisk;
      if (!f) return;

      const heelL = f.fsr.left[0];
      const heelR = f.fsr.right[0];
      const toeL = f.fsr.left[3];
      const toeR = f.fsr.right[3];

      // Heel strike: heel FSR rises past 0.45 after being released.
      const heelHigh = Math.max(heelL, heelR) > 0.45;
      if (heelHigh && !flags.current.heelDown) {
        flags.current.heelDown = true;
        setState((p) => ({ ...p, heel: p.heel + 1 }));
        setFlash((p) => ({ ...p, heel: true }));
        setTimeout(() => setFlash((p) => ({ ...p, heel: false })), 200);
      } else if (!heelHigh) flags.current.heelDown = false;

      // Toe off: toe FSR rises past 0.4.
      const toeHigh = Math.max(toeL, toeR) > 0.4;
      if (toeHigh && !flags.current.toeDown) {
        flags.current.toeDown = true;
        setState((p) => ({ ...p, toe: p.toe + 1 }));
        setFlash((p) => ({ ...p, toe: true }));
        setTimeout(() => setFlash((p) => ({ ...p, toe: false })), 200);
      } else if (!toeHigh) flags.current.toeDown = false;

      const strideVar = pose ? Math.round((1 - pose.metrics.stepLengthSym) * 40) : 0;
      const fall = !risk ? "clear" : risk.level === "high" ? "alert" : risk.level === "mild" ? "watch" : "clear";
      setState((p) => ({ ...p, strideVar, fall }));
    }, 60);
    return () => clearInterval(id);
  }, []);

  const fallMeta = {
    clear: { label: "No falls detected", cls: "text-good-ink", bg: "bg-good/10", dot: "bg-good" },
    watch: { label: "Monitoring", cls: "text-warning-ink", bg: "bg-warning/10", dot: "bg-warning" },
    alert: { label: "Instability — watch", cls: "text-critical-ink", bg: "bg-critical/10", dot: "bg-critical" },
  }[state.fall];

  return (
    <Panel className="flex flex-col">
      <PanelHeader title="Detected Events" icon={<Activity size={14} />} />
      <PanelBody className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
        <EventTile icon={ArrowDownToLine} label="Heel Strike" value={state.heel} unit="events" flash={flash.heel} color="var(--s-1)" />
        <EventTile icon={ArrowUpFromLine} label="Toe Off" value={state.toe} unit="events" flash={flash.toe} color="var(--s-3)" />
        <EventTile icon={Waves} label="Stride Var." value={state.strideVar} unit="%" color="var(--s-4)" />
        <div className={`flex flex-col justify-between rounded-xl border border-line p-3 ${fallMeta.bg}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
            <ShieldAlert size={12} /> Fall Detection
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${fallMeta.dot}`} />
            <span className={`text-[12px] font-semibold ${fallMeta.cls}`}>{fallMeta.label}</span>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}

function EventTile({
  icon: Icon,
  label,
  value,
  unit,
  flash,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  unit: string;
  flash?: boolean;
  color: string;
}) {
  return (
    <motion.div
      animate={flash ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.2 }}
      className="flex flex-col justify-between rounded-xl border border-line bg-surface-2 p-3"
      style={flash ? { borderColor: color } : undefined}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
        <Icon size={12} style={{ color }} /> {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="tnum text-xl font-semibold text-ink">{value}</span>
        <span className="text-[10px] text-muted">{unit}</span>
      </div>
    </motion.div>
  );
}
