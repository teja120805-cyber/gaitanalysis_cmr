import { cn } from "@/lib/utils";

/** A compact stat tile: label · value · optional unit and trend hint. */
export function Stat({
  label,
  value,
  unit,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "default" | "good" | "warning" | "critical" | "accent";
  hint?: string;
}) {
  const toneClass = {
    default: "text-ink",
    good: "text-good",
    warning: "text-warning",
    critical: "text-critical",
    accent: "text-accent",
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("tnum text-xl font-semibold leading-none", toneClass)}>
          {value}
        </span>
        {unit && <span className="text-[11px] text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-[10px] text-ink-secondary">{hint}</div>}
    </div>
  );
}
