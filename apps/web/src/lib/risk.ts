import type { RiskLevel } from "./types";

/** Maps the fused score onto the three clinical bands. Mirrors the rule engine. */
export function levelFromScore(score: number): RiskLevel {
  if (score < 0.33) return "normal";
  if (score < 0.66) return "mild";
  return "high";
}

interface LevelMeta {
  label: string;
  short: string;
  /** CSS var reference into the reserved status palette. */
  color: string;
  /** Tailwind text token. */
  text: string;
  bg: string;
  ring: string;
}

export const LEVEL: Record<RiskLevel, LevelMeta> = {
  normal: {
    label: "Normal",
    short: "NORM",
    color: "var(--status-good)",
    text: "text-good-ink",
    bg: "bg-good/10",
    ring: "ring-good/25",
  },
  mild: {
    label: "Mild Risk",
    short: "MILD",
    color: "var(--status-warning)",
    text: "text-warning-ink",
    bg: "bg-warning/10",
    ring: "ring-warning/25",
  },
  high: {
    label: "High Risk",
    short: "HIGH",
    color: "var(--status-critical)",
    text: "text-critical-ink",
    bg: "bg-critical/10",
    ring: "ring-critical/25",
  },
};

export function levelColor(level: RiskLevel) {
  return LEVEL[level].color;
}
