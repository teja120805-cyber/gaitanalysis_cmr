/**
 * Browser port of apps/vision/gait_metrics.py (GaitAnalyzer).
 * Turns a live MediaPipe pose stream into GaitGuard's PoseFrame metrics:
 *   { cadence, stepLengthSym, armSwingSym, trunkSway, doubleSupport }
 * Heel-strike detection (ankle rolling-mean crossings) → cadence; wrist amplitude
 * → arm-swing symmetry; shoulder→hip lean variability → trunk sway; double-support
 * estimated from cadence. EMA-smoothed for stability.
 */

export interface PoseMetrics {
  cadence: number;
  stepLengthSym: number;
  armSwingSym: number;
  trunkSway: number;
  doubleSupport: number;
}

export interface LM {
  x: number;
  y: number;
  z?: number;
}

// MediaPipe Pose landmark indices
const L_ANKLE = 27,
  R_ANKLE = 28,
  L_WRIST = 15,
  R_WRIST = 16,
  L_SH = 11,
  R_SH = 12,
  L_HIP = 23,
  R_HIP = 24;

const WINDOW = 3.0; // seconds

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

class Foot {
  private ys: number[] = [];
  private prevY: number | null = null;
  private lastStrikeX: number | null = null;
  private stepLengths: number[] = [];

  update(x: number, y: number): boolean {
    this.ys.push(y);
    if (this.ys.length > 40) this.ys.shift();
    let struck = false;
    if (this.ys.length >= 6) {
      const mean = this.ys.reduce((a, b) => a + b, 0) / this.ys.length;
      if (this.prevY !== null && this.prevY < mean && mean <= y) {
        struck = true;
        if (this.lastStrikeX !== null) {
          this.stepLengths.push(Math.abs(x - this.lastStrikeX));
          if (this.stepLengths.length > 6) this.stepLengths.shift();
        }
        this.lastStrikeX = x;
      }
    }
    this.prevY = y;
    return struck;
  }

  get meanStepLength(): number {
    return this.stepLengths.length
      ? this.stepLengths.reduce((a, b) => a + b, 0) / this.stepLengths.length
      : 0;
  }
}

export class BrowserGaitAnalyzer {
  private left = new Foot();
  private right = new Foot();
  private stepEvents: number[] = [];
  private leftWristX: [number, number][] = [];
  private rightWristX: [number, number][] = [];
  private trunkAngles: [number, number][] = [];
  private t0: number | null = null;
  private ema: Record<string, number> = {};

  private trim(dq: [number, number][], now: number) {
    while (dq.length && now - dq[0][0] > WINDOW) dq.shift();
  }
  private emaUpdate(key: string, value: number, alpha = 0.25) {
    const prev = this.ema[key];
    const out = prev === undefined ? value : prev + alpha * (value - prev);
    this.ema[key] = out;
    return out;
  }
  private amp(dq: [number, number][]) {
    if (dq.length < 3) return 0;
    const xs = dq.map((d) => d[1]);
    return Math.max(...xs) - Math.min(...xs);
  }

  /** @param lms 33 MediaPipe landmarks · @param tMs timestamp in ms */
  feed(lms: LM[], tMs: number): PoseMetrics {
    const t = tMs / 1000;
    if (this.t0 === null) this.t0 = t;

    const la = lms[L_ANKLE],
      ra = lms[R_ANKLE],
      lw = lms[L_WRIST],
      rw = lms[R_WRIST],
      ls = lms[L_SH],
      rs = lms[R_SH],
      lh = lms[L_HIP],
      rh = lms[R_HIP];
    if (!la || !ra || !ls || !rs || !lh || !rh) return this.output(t);

    if (this.left.update(la.x, la.y)) this.stepEvents.push(t);
    if (this.right.update(ra.x, ra.y)) this.stepEvents.push(t);
    while (this.stepEvents.length && t - this.stepEvents[0] > WINDOW) this.stepEvents.shift();

    if (lw) this.leftWristX.push([t, lw.x]);
    if (rw) this.rightWristX.push([t, rw.x]);
    this.trim(this.leftWristX, t);
    this.trim(this.rightWristX, t);

    const shMid = [(ls.x + rs.x) / 2, (ls.y + rs.y) / 2];
    const hipMid = [(lh.x + rh.x) / 2, (lh.y + rh.y) / 2];
    const dx = shMid[0] - hipMid[0];
    const dy = Math.max(1e-4, hipMid[1] - shMid[1]);
    const trunkAngle = Math.abs((Math.atan2(dx, dy) * 180) / Math.PI);
    this.trunkAngles.push([t, trunkAngle]);
    this.trim(this.trunkAngles, t);

    return this.output(t);
  }

  private output(t: number): PoseMetrics {
    const elapsed = Math.max(0.5, Math.min(WINDOW, t - (this.t0 ?? t)));
    let cadence = (this.stepEvents.length / elapsed) * 60;
    cadence = clamp(cadence, 0, 200);

    const l = this.left.meanStepLength,
      r = this.right.meanStepLength;
    const stepSym = l + r > 1e-4 ? 1 - Math.abs(l - r) / (l + r) : 1;

    const al = this.amp(this.leftWristX),
      ar = this.amp(this.rightWristX);
    const armSym = al + ar < 0.02 ? 1 : 1 - Math.abs(al - ar) / (al + ar);

    let trunkSway = 1.5;
    if (this.trunkAngles.length >= 4) {
      const vals = this.trunkAngles.map((d) => d[1]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
      trunkSway = std * 2.5;
    }

    const doubleSupport = clamp(34 - (cadence - 40) * 0.14, 16, 40);

    return {
      cadence: +this.emaUpdate("cadence", cadence).toFixed(1),
      stepLengthSym: +clamp(this.emaUpdate("stepLengthSym", stepSym), 0, 1).toFixed(3),
      armSwingSym: +clamp(this.emaUpdate("armSwingSym", armSym), 0, 1).toFixed(3),
      trunkSway: +clamp(this.emaUpdate("trunkSway", trunkSway), 0, 14).toFixed(2),
      doubleSupport: +this.emaUpdate("doubleSupport", doubleSupport).toFixed(1),
    };
  }

  static idle(): PoseMetrics {
    return { cadence: 0, stepLengthSym: 1, armSwingSym: 1, trunkSway: 1.5, doubleSupport: 22 };
  }
}
