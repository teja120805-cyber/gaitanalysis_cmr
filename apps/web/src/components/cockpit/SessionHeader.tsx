"use client";

import { useEffect, useState } from "react";
import { useLiveStore } from "@/lib/store";
import { StatusPill } from "@/components/ui/StatusPill";
import { LEVEL } from "@/lib/risk";
import { elapsed } from "@/lib/utils";
import type { Patient } from "@/lib/types";
import { CircleDot, Clock, User } from "lucide-react";

export function SessionHeader({ patient }: { patient: Patient }) {
  const risk = useLiveStore((s) => s.latestRisk);
  const start = useLiveStore((s) => s.sessionStart);
  const level = risk?.level ?? "normal";
  const meta = LEVEL[level];

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-clinical border border-line bg-surface p-4"
      style={{ boxShadow: `inset 3px 0 0 0 ${meta.color}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-secondary">
            <User size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                {patient.name}
              </h2>
              <span className="tnum rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                {patient.mrn}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
              <span>
                {patient.age}y · {patient.sex === "F" ? "Female" : "Male"}
              </span>
              <span className="text-line">|</span>
              <span>{patient.room}</span>
              <span className="text-line">|</span>
              <span className="text-ink-secondary">{patient.condition}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <Meta
            icon={<Clock size={13} />}
            label="Session"
            value={elapsed(start, now)}
          />
          <Meta
            icon={<CircleDot size={13} className="text-good" />}
            label="Streams"
            value="Insole + Vision"
          />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted">
              Current state
            </span>
            <StatusPill level={level} size="lg" pulse={level !== "normal"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="hidden flex-col items-end lg:flex">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
        {icon}
        {label}
      </span>
      <span className="tnum text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
