"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveStore } from "@/lib/store";

/**
 * Computes the 7 live gait metrics for the monitoring page from the raw sensor +
 * pose stream, sampled at 5 Hz with short rolling windows:
 *   stride variability, cadence, pressure symmetry, centre-of-pressure path,
 *   trunk sway, tremor, step count.
 * Cadence / trunk / stride come from the vision metrics; symmetry / CoP / steps
 * from the insole; tremor from wrist-landmark jitter (best-effort estimate).
 */
export type VitalKey =
  | "stride"
  | "cadence"
  | "symmetry"
  | "cop"
  | "trunk"
  | "tremor"
  | "steps";

export interface Vitals {
  stride: number;
  cadence: number;
  symmetry: number;
  cop: number;
  trunk: number;
  tremor: number;
  steps: number;
  h: Record<VitalKey, number[]>;
}

const CAP = 40;
// FSR positions per foot [heel, lateral, medial, toe] in a normalized foot box.
const SENS: [number, number][] = [
  [0.5, 0.82],
  [0.28, 0.42],
  [0.72, 0.42],
  [0.5, 0.14],
];

function empty(): Vitals {
  return {
    stride: 0, cadence: 0, symmetry: 100, cop: 0, trunk: 0, tremor: 0, steps: 0,
    h: { stride: [], cadence: [], symmetry: [], cop: [], trunk: [], tremor: [], steps: [] },
  };
}

export function useGaitVitals(): Vitals {
  const [v, setV] = useState<Vitals>(empty);
  const st = useRef({
    cop: [] as { t: number; x: number; y: number }[],
    wrist: [] as { t: number; x: number }[],
    heelDown: false,
    steps: 0,
    last: { stride: 0, cadence: 0, symmetry: 100, trunk: 0, cop: 0, tremor: 0 },
  });

  useEffect(() => {
    const id = setInterval(() => {
      const s = useLiveStore.getState();
      const ins = s.latestInsole;
      const pose = s.latestPose;
      const now = performance.now();
      const r = st.current;

      const cadence = pose?.metrics.cadence ?? r.last.cadence;
      const stride = pose
        ? Math.max(0, Math.min(25, (1 - pose.metrics.stepLengthSym) * 40))
        : r.last.stride;
      const trunk =
        pose?.metrics.trunkSway ??
        (ins ? Math.min(14, Math.hypot(ins.imu.ax, ins.imu.ay) * 10) : r.last.trunk);

      // Pressure symmetry (L/R balance) from the insole.
      let symmetry = r.last.symmetry;
      if (ins) {
        const L = ins.fsr.left.reduce((a, b) => a + b, 0);
        const R = ins.fsr.right.reduce((a, b) => a + b, 0);
        const tot = L + R;
        if (tot > 0.05) symmetry = Math.max(0, Math.min(100, 100 - (Math.abs(L - R) / tot) * 100));
      }

      // Centre-of-pressure path length over a 2 s window.
      let cop = r.last.cop;
      if (ins) {
        let sx = 0, sy = 0, tt = 0;
        const add = (vals: number[] | readonly number[], off: number) =>
          vals.forEach((val, i) => {
            sx += (SENS[i][0] + off) * val;
            sy += SENS[i][1] * val;
            tt += val;
          });
        add(ins.fsr.left, -0.5);
        add(ins.fsr.right, 0.5);
        if (tt > 0.05) {
          r.cop.push({ t: now, x: sx / tt, y: sy / tt });
          while (r.cop.length && now - r.cop[0].t > 2000) r.cop.shift();
          let path = 0;
          for (let i = 1; i < r.cop.length; i++) {
            path += Math.hypot(r.cop[i].x - r.cop[i - 1].x, r.cop[i].y - r.cop[i - 1].y);
          }
          cop = path * 40; // normalized → ~cm
        }
      }

      // Tremor — wrist-landmark jitter over ~1.2 s (best-effort).
      let tremor = r.last.tremor;
      if (pose?.landmarks?.length) {
        const w = pose.landmarks[16] || pose.landmarks[15];
        if (w) {
          r.wrist.push({ t: now, x: w[0] });
          while (r.wrist.length && now - r.wrist[0].t > 1200) r.wrist.shift();
          if (r.wrist.length > 4) {
            const xs = r.wrist.map((p) => p.x);
            const m = xs.reduce((a, b) => a + b, 0) / xs.length;
            const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
            tremor = Math.min(80, sd * 1500);
          }
        }
      }

      // Step count via heel-strike detection.
      if (ins) {
        const heel = Math.max(ins.fsr.left[0], ins.fsr.right[0]);
        if (heel > 0.45 && !r.heelDown) {
          r.heelDown = true;
          r.steps++;
        } else if (heel < 0.3) {
          r.heelDown = false;
        }
      }

      r.last = { stride, cadence, symmetry, trunk, cop, tremor };

      setV((prev) => {
        const push = (arr: number[], val: number) => {
          const n = [...arr, Math.round(val * 100) / 100];
          return n.length > CAP ? n.slice(n.length - CAP) : n;
        };
        return {
          stride, cadence, symmetry, cop, trunk, tremor, steps: r.steps,
          h: {
            stride: push(prev.h.stride, stride),
            cadence: push(prev.h.cadence, cadence),
            symmetry: push(prev.h.symmetry, symmetry),
            cop: push(prev.h.cop, cop),
            trunk: push(prev.h.trunk, trunk),
            tremor: push(prev.h.tremor, tremor),
            steps: push(prev.h.steps, r.steps),
          },
        };
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  return v;
}
