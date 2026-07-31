"use client";

import { useLiveStore } from "@/lib/store";
import { LEVEL } from "@/lib/risk";
import { Panel } from "@/components/ui/Panel";

/**
 * The hero: a 270° radial gauge of the fused risk score. Color comes from the
 * reserved status palette and is always paired with the level label + score, so
 * meaning never rests on hue alone.
 */
export function RiskGauge() {
  const risk = useLiveStore((s) => s.latestRisk);
  const score = risk?.score ?? 0;
  const level = risk?.level ?? "normal";
  const meta = LEVEL[level];

  const size = 220;
  const stroke = 16;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135; // sweep from 135° clockwise 270°
  const sweep = 270;

  const arc = describeArc(cx, cy, r, startAngle, startAngle + sweep);
  const valueArc = describeArc(
    cx,
    cy,
    r,
    startAngle,
    startAngle + sweep * score
  );

  // Threshold ticks at 0.33 and 0.66
  const ticks = [0.33, 0.66].map((f) => {
    const a = ((startAngle + sweep * f) * Math.PI) / 180;
    return {
      x1: cx + (r - stroke / 2 - 2) * Math.cos(a),
      y1: cy + (r - stroke / 2 - 2) * Math.sin(a),
      x2: cx + (r + stroke / 2 + 2) * Math.cos(a),
      y2: cy + (r + stroke / 2 + 2) * Math.sin(a),
    };
  });

  return (
    <Panel className="flex flex-col items-center justify-center overflow-hidden p-5">
      <div className="mb-1 self-start text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        Fused Fall-Risk Score
      </div>

      <div className="relative" style={{ width: size, height: size * 0.82 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <path
            d={arc}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Value */}
          <path
            d={valueArc}
            fill="none"
            stroke={meta.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {/* Threshold ticks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="var(--muted)"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div
            className="tnum text-[52px] font-semibold leading-none"
            style={{ color: meta.color }}
          >
            {Math.round(score * 100)}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-muted">
            / 100
          </div>
        </div>
      </div>

      <div className="mt-1 flex w-full items-center justify-between">
        <div>
          <div className="text-2xl font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="text-[11px] text-muted">
            Model confidence{" "}
            <span className="tnum text-ink-secondary">
              {Math.round((risk?.confidence ?? 0) * 100)}%
            </span>
          </div>
        </div>
        <ScaleKey />
      </div>
    </Panel>
  );
}

function ScaleKey() {
  return (
    <div className="flex flex-col gap-1 text-[10px] text-muted">
      {(
        [
          ["good", "Normal", "0–32"],
          ["warning", "Mild", "33–65"],
          ["critical", "High", "66–100"],
        ] as const
      ).map(([tone, label, range]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: `var(--status-${tone})` }}
          />
          <span className="text-ink-secondary">{label}</span>
          <span className="tnum">{range}</span>
        </div>
      ))}
    </div>
  );
}

// --- SVG arc math -------------------------------------------------------
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const large = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}
