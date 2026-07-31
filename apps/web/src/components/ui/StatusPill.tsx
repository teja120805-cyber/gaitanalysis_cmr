import { LEVEL } from "@/lib/risk";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Risk state, carried by color + icon + label together (never color alone) —
 * the design-system rule for reserved status colors.
 */
export function StatusPill({
  level,
  size = "md",
  pulse = false,
}: {
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}) {
  const meta = LEVEL[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold uppercase tracking-wider ring-1",
        meta.bg,
        meta.text,
        meta.ring,
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-[11px]",
        size === "lg" && "px-3.5 py-1.5 text-sm"
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full",
          size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          pulse && "animate-pulse-ring"
        )}
        style={{
          background: meta.color,
          // @ts-expect-error CSS var for the keyframe
          "--pulse-color": meta.color,
        }}
      />
      {meta.label}
    </span>
  );
}
