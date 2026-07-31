"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { MotionCard } from "@/components/ui/motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Sparkline } from "@/components/overview/Sparkline";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  icon: Icon,
  tone = "primary",
  delta,
  deltaGood,
  spark,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  tone?: "primary" | "good" | "warning" | "critical";
  delta?: string;
  deltaGood?: boolean;
  spark: number[];
}) {
  const toneMap = {
    primary: { text: "text-primary", bg: "bg-primary-soft", stroke: "var(--primary)" },
    good: { text: "text-good-ink", bg: "bg-good/10", stroke: "var(--status-good)" },
    warning: { text: "text-warning-ink", bg: "bg-warning/10", stroke: "var(--status-warning)" },
    critical: { text: "text-critical-ink", bg: "bg-critical/10", stroke: "var(--status-critical)" },
  }[tone];

  return (
    <MotionCard accent className="p-5">
      <div className="flex items-start justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap.bg)}>
          <Icon size={18} className={toneMap.text} />
        </span>
        {delta && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              deltaGood ? "bg-good/10 text-good-ink" : "bg-critical/10 text-critical-ink"
            )}
          >
            {deltaGood ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
            {label}
          </div>
          <div className="mt-1 text-[30px] font-semibold leading-none text-ink">
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          </div>
        </div>
        <div className="opacity-90">
          <Sparkline data={spark} color={toneMap.stroke} width={84} height={34} />
        </div>
      </div>
    </MotionCard>
  );
}
