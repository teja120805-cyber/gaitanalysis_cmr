"use client";

import { useEffect, useRef } from "react";
import { useLiveStore } from "@/lib/store";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { Footprints } from "lucide-react";

/**
 * Plantar pressure heatmap. Renders on a canvas at animation-frame rate, reading
 * the latest insole frame directly from the store (no React re-render at 50 Hz).
 * Magnitude uses the sequential BLUE ramp — one hue, light→dark — per the design
 * system (pressure is a continuous magnitude, so it's sequential, not rainbow).
 */

// FSR positions per foot in a normalized foot box: [heel, lateral, medial, toe].
const SENSORS: [number, number][] = [
  [0.5, 0.82], // heel
  [0.28, 0.42], // lateral
  [0.72, 0.42], // medial
  [0.5, 0.14], // toe
];

// Sequential blue ramp stops (low → high).
const RAMP: [number, [number, number, number]][] = [
  [0.0, [17, 21, 27]], // near surface
  [0.25, [24, 79, 149]], // seq-600
  [0.5, [42, 120, 214]], // seq-450
  [0.75, [109, 167, 236]], // seq-300
  [1.0, [205, 226, 251]], // seq-100
];

function rampColor(v: number): string {
  const t = Math.min(1, Math.max(0, v));
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1];
      const [t1, c1] = RAMP[i];
      const f = (t - t0) / (t1 - t0);
      const c = c0.map((ch, k) => Math.round(ch + (c1[k] - ch) * f));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return "rgb(205,226,251)";
}

export function FootHeatmap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const frame = useLiveStore.getState().latestInsole;
      const footW = w * 0.36;
      const footH = h * 0.86;
      const gap = w * 0.12;
      const totalW = footW * 2 + gap;
      const x0 = (w - totalW) / 2;
      const y0 = (h - footH) / 2;

      drawFoot(ctx, x0, y0, footW, footH, frame?.fsr.left ?? [0, 0, 0, 0], "L", false);
      drawFoot(ctx, x0 + footW + gap, y0, footW, footH, frame?.fsr.right ?? [0, 0, 0, 0], "R", true);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelHeader
        title="Plantar Pressure"
        icon={<Footprints size={14} />}
        right={<RampLegend />}
      />
      <PanelBody className="flex-1">
        <div className="viewport h-full min-h-[240px] w-full overflow-hidden">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </PanelBody>
    </Panel>
  );
}

function drawFoot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fsr: number[] | readonly number[],
  label: string,
  mirror: boolean
) {
  // Foot outline (rounded, big toe side toward center).
  ctx.save();
  ctx.translate(x, y);
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  ctx.beginPath();
  footPath(ctx, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.stroke();

  // Pressure blobs via radial gradients, clipped to the foot.
  ctx.save();
  ctx.beginPath();
  footPath(ctx, w, h);
  ctx.clip();
  SENSORS.forEach(([sx, sy], i) => {
    const v = Math.min(1, Math.max(0, fsr[i] ?? 0));
    if (v < 0.02) return;
    const px = sx * w;
    const py = sy * h;
    const rad = w * (0.34 + v * 0.16);
    const grad = ctx.createRadialGradient(px, py, 1, px, py, rad);
    const col = rampColor(v);
    grad.addColorStop(0, col);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.35 + v * 0.55;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
  ctx.restore();
  ctx.globalAlpha = 1;

  // Sensor dots
  SENSORS.forEach(([sx, sy], i) => {
    const v = Math.min(1, Math.max(0, fsr[i] ?? 0));
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, 3, 0, Math.PI * 2);
    ctx.fillStyle = v > 0.35 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)";
    ctx.fill();
  });

  ctx.restore();

  // Label (unmirrored)
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label === "L" ? "LEFT" : "RIGHT", x + w / 2, y + h + 16);
}

function footPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Simple foot silhouette using bezier curves.
  ctx.moveTo(w * 0.5, h * 0.02);
  ctx.bezierCurveTo(w * 0.9, h * 0.02, w * 0.95, h * 0.3, w * 0.8, h * 0.5);
  ctx.bezierCurveTo(w * 0.72, h * 0.66, w * 0.82, h * 0.82, w * 0.68, h * 0.95);
  ctx.bezierCurveTo(w * 0.58, h * 1.02, w * 0.42, h * 1.02, w * 0.32, h * 0.95);
  ctx.bezierCurveTo(w * 0.18, h * 0.82, w * 0.28, h * 0.66, w * 0.2, h * 0.5);
  ctx.bezierCurveTo(w * 0.05, h * 0.3, w * 0.1, h * 0.02, w * 0.5, h * 0.02);
  ctx.closePath();
}

function RampLegend() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted">
      <span>Low</span>
      <div
        className="h-2 w-20 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, #11151b, #184f95, #2a78d6, #6da7ec, #cde2fb)",
        }}
      />
      <span>High</span>
    </div>
  );
}
