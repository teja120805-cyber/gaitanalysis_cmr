"use client";

import { useEffect, useRef } from "react";
import { useLiveStore } from "@/lib/store";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { Crosshair } from "lucide-react";

/**
 * Center-of-Pressure trajectory. The CoP is the FSR-weighted centroid across both
 * feet; its wander (sway area) is a balance/instability marker. Rendered on the
 * dark imaging viewport with a fading trail.
 */
const SENSORS: [number, number][] = [
  [0.5, 0.82], // heel
  [0.28, 0.42], // lateral
  [0.72, 0.42], // medial
  [0.5, 0.14], // toe
];

export function CenterOfPressure() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trail = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // crosshair grid
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
      for (const rr of [0.18, 0.34, 0.5]) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * rr, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.stroke();
      }

      const f = useLiveStore.getState().latestInsole;
      if (f) {
        // Weighted centroid across both feet (left feet shifted left, right right).
        let sx = 0, sy = 0, tot = 0;
        const add = (vals: number[] | readonly number[], offX: number) => {
          vals.forEach((v, i) => {
            sx += (SENSORS[i][0] + offX) * v;
            sy += SENSORS[i][1] * v;
            tot += v;
          });
        };
        add(f.fsr.left, -0.5);
        add(f.fsr.right, 0.5);
        if (tot > 0.05) {
          const nx = sx / tot; // ~ -0.5..1.5 range around feet
          const ny = sy / tot; // 0..1
          const px = w / 2 + (nx - 0.5) * w * 0.7;
          const py = h * 0.15 + ny * h * 0.7;
          trail.current.push({ x: px, y: py });
          if (trail.current.length > 60) trail.current.shift();
        }
      }

      // trail
      const pts = trail.current;
      for (let i = 1; i < pts.length; i++) {
        const a = i / pts.length;
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = `rgba(56,189,248,${a * 0.8})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      const head = pts[pts.length - 1];
      if (head) {
        ctx.beginPath();
        ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelHeader title="Center of Pressure" icon={<Crosshair size={14} />}
        right={<span className="text-[10px] text-muted">sway trajectory</span>} />
      <PanelBody className="flex-1">
        <div className="viewport h-full min-h-[200px] w-full overflow-hidden">
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      </PanelBody>
    </Panel>
  );
}
