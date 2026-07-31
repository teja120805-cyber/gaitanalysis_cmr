import { levelFromScore } from "./risk";
import { useLiveStore } from "./store";
import type { InsoleFrame, PoseFrame, RiskDriver, RiskUpdate } from "./types";

/**
 * MockStream — a self-contained, biomechanically-plausible replacement for the
 * ESP32 + MediaPipe + Fusion Engine backend, so the Live Cockpit runs with zero
 * infrastructure. It simulates a walking patient whose gait severity drifts over
 * a ~90s scenario (Normal → Mild → High → recovery) and runs the SAME rule-based
 * fusion the real engine will: features → weighted score → level → drivers.
 *
 * When the FastAPI WS lands, delete this file and point the store actions at the
 * socket's tagged messages — the payload shapes already match lib/types.
 */

const TAU = Math.PI * 2;

// Emission cadences (ms)
const INSOLE_DT = 20; // 50 Hz
const POSE_DT = 33; // ~30 Hz
const SENSOR_PUSH_DT = 80; // ~12.5 Hz into chart buffers
const RISK_DT = 500; // 2 Hz fused assessment

function noise(scale = 1) {
  return (Math.random() - 0.5) * 2 * scale;
}

/** Gaussian bump helper for shaping stance-phase pressure. */
function bump(x: number, center: number, width: number) {
  const d = (x - center) / width;
  return Math.exp(-0.5 * d * d);
}

/** Plantar pressure across [heel, lateral, medial, toe] for a stance fraction. */
function footRollover(stance: number): [number, number, number, number] {
  const heel = bump(stance, 0.12, 0.14);
  const lateral = bump(stance, 0.45, 0.2) * 0.85;
  const medial = bump(stance, 0.58, 0.22) * 0.9;
  const toe = bump(stance, 0.86, 0.16);
  return [heel, lateral, medial, toe];
}

export class MockStream {
  private raf = 0;
  private tInsole = 0;
  private tPose = 0;
  private tSensor = 0;
  private tRisk = 0;
  private phase = 0; // gait cycle phase 0..1 (both feet)
  private startedAt = 0;
  private freezeUntil = 0; // freezing-of-gait episode end (ms)
  private lastAlertAt = 0;
  private running = false;

  start() {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    const store = useLiveStore.getState();
    store.reset();
    store.setConn("connecting");
    setTimeout(() => useLiveStore.getState().setConn("live"), 650);
    let last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(50, now - last);
      last = now;
      this.tick(now, dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    useLiveStore.getState().setConn("offline");
  }

  /** Scenario severity 0..1 over the session timeline. */
  private severity(now: number): number {
    const s = (now - this.startedAt) / 1000; // seconds elapsed
    // Ramp up to a High episode around 55s, then partial recovery.
    const t = s % 120;
    if (t < 20) return 0.15 + 0.05 * Math.sin(t); // normal
    if (t < 45) return 0.15 + ((t - 20) / 25) * 0.35; // drifting to mild
    if (t < 70) return 0.5 + ((t - 45) / 25) * 0.4; // climbing to high
    if (t < 95) return 0.9 - ((t - 70) / 25) * 0.55; // recovery to mild
    return 0.35 - ((t - 95) / 25) * 0.2; // settling toward normal
  }

  private tick(now: number, dt: number) {
    const sev = clamp01(this.severity(now));
    const store = useLiveStore.getState();

    // --- gait clock -------------------------------------------------------
    // Cadence falls and grows variable with severity; freezing halts it.
    const inFreeze = now < this.freezeUntil;
    const baseCadence = 108 - sev * 34; // steps/min
    const cadence = inFreeze
      ? 4
      : baseCadence + noise(sev * 10);
    const cyclesPerMs = cadence / 60 / 2 / 1000; // 2 steps per full cycle
    this.phase = (this.phase + cyclesPerMs * dt) % 1;

    // Random freezing episodes when severity is high.
    if (!inFreeze && sev > 0.7 && Math.random() < 0.004) {
      this.freezeUntil = now + 800 + Math.random() * 1400;
    }

    // --- INSOLE (50 Hz) ---------------------------------------------------
    if (now - this.tInsole >= INSOLE_DT) {
      this.tInsole = now;
      store.setInsole(this.insoleFrame(sev, inFreeze));
    }

    // --- POSE (30 Hz) -----------------------------------------------------
    if (now - this.tPose >= POSE_DT) {
      this.tPose = now;
      store.setPose(this.poseFrame(sev));
    }

    // --- chart buffers (12.5 Hz) -----------------------------------------
    if (now - this.tSensor >= SENSOR_PUSH_DT) {
      this.tSensor = now;
      const ins = useLiveStore.getState().latestInsole;
      if (ins) {
        const loadL = sum(ins.fsr.left);
        const loadR = sum(ins.fsr.right);
        const sway = Math.hypot(ins.imu.ax, ins.imu.ay) + Math.abs(ins.imu.gz) / 90;
        store.pushSensor({ t: Date.now(), loadL, loadR, sway });
      }
    }

    // --- FUSED RISK (2 Hz) -----------------------------------------------
    if (now - this.tRisk >= RISK_DT) {
      this.tRisk = now;
      const risk = this.fuse(sev, inFreeze, cadence);
      store.setRisk(risk);
      store.pushRiskPoint({ t: Date.now(), score: risk.score });
      this.maybeAlert(risk, now);
    }
  }

  private insoleFrame(sev: number, inFreeze: boolean): InsoleFrame {
    // Left foot leads the first half of the cycle, right the second, with an
    // overlap window that shrinks (less double support) as severity rises.
    const p = this.phase;
    const stanceFrac = 0.62; // fraction of cycle each foot is on ground
    const leftStance = phaseToStance(p, 0, stanceFrac);
    const rightStance = phaseToStance(p, 0.5, stanceFrac);

    // Asymmetry: weaker push-off on the affected (right) side with severity.
    const asym = 1 - sev * 0.4;
    const scale = inFreeze ? 0.25 : 1;

    const left = footRollover(leftStance ?? -1).map(
      (v) => clamp01((leftStance == null ? 0.02 : v) * scale + noise(0.03))
    ) as [number, number, number, number];
    const right = footRollover(rightStance ?? -1).map(
      (v) =>
        clamp01((rightStance == null ? 0.02 : v) * scale * asym + noise(0.03))
    ) as [number, number, number, number];

    const impact = leftStance != null && leftStance < 0.15 ? 0.6 : 0;
    const sway = sev * 0.35;
    return {
      t: Date.now(),
      fsr: { left, right },
      imu: {
        ax: noise(0.05 + sway) ,
        ay: noise(0.05 + sway),
        az: 1 + impact + noise(0.08),
        gx: noise(8 + sev * 40),
        gy: noise(8 + sev * 40),
        gz: noise(6 + sev * 55),
      },
    };
  }

  private poseFrame(sev: number): PoseFrame {
    // A lightweight standing/walking skeleton in normalized coords. The z-depth
    // and a gentle sway animate so the 3D view feels alive without a real model.
    const p = this.phase;
    const swing = Math.sin(p * TAU); // leg/arm swing driver
    const armAmp = 0.12 * (1 - sev * 0.6); // reduced arm swing with severity
    const sway = sev * 0.03 * Math.sin(now01() * TAU);

    const L = buildSkeleton(swing, armAmp, sway, sev);
    return {
      t: Date.now(),
      landmarks: L,
      metrics: {
        cadence: 108 - sev * 34,
        stepLengthSym: clamp01(1 - sev * 0.5 + noise(0.03)),
        armSwingSym: clamp01(1 - sev * 0.55 + noise(0.03)),
        trunkSway: 1.5 + sev * 7 + noise(0.4),
        doubleSupport: 18 + sev * 14 + noise(1),
      },
    };
  }

  /** The rule-based fusion: normalized features → weighted score → drivers. */
  private fuse(sev: number, inFreeze: boolean, cadence: number): RiskUpdate {
    const pose = useLiveStore.getState().latestPose;
    const m = pose?.metrics;

    // Feature deviations, each 0..1 (higher = worse).
    const f = {
      loadAsym: clamp01(sev * 0.9 + noise(0.05)),
      sway: clamp01((m ? m.trunkSway / 10 : sev) + noise(0.04)),
      armSwing: clamp01((m ? 1 - m.armSwingSym : sev) + noise(0.04)),
      cadence: clamp01((110 - cadence) / 80),
      doubleSupport: clamp01((m ? (m.doubleSupport - 18) / 18 : sev)),
      freeze: inFreeze ? 1 : clamp01(sev * 0.4),
    };

    const weights: Record<keyof typeof f, { w: number; label: string; source: RiskDriver["source"] }> = {
      loadAsym: { w: 0.22, label: "Plantar load asymmetry", source: "insole" },
      freeze: { w: 0.2, label: "Freezing / festination", source: "fusion" },
      sway: { w: 0.18, label: "Trunk sway", source: "vision" },
      armSwing: { w: 0.16, label: "Reduced arm swing", source: "vision" },
      cadence: { w: 0.14, label: "Cadence slowing", source: "insole" },
      doubleSupport: { w: 0.1, label: "Double-support time", source: "fusion" },
    };

    let score = 0;
    const drivers: RiskDriver[] = [];
    (Object.keys(f) as (keyof typeof f)[]).forEach((k) => {
      const contribution = f[k] * weights[k].w;
      score += contribution;
      drivers.push({
        key: k,
        label: weights[k].label,
        weight: contribution,
        source: weights[k].source,
      });
    });
    score = clamp01(score);
    drivers.sort((a, b) => b.weight - a.weight);

    return {
      t: Date.now(),
      score,
      level: levelFromScore(score),
      confidence: clamp01(0.78 + 0.18 * (1 - Math.abs(score - 0.5) * 2) + noise(0.03)),
      drivers,
    };
  }

  private maybeAlert(risk: RiskUpdate, now: number) {
    if (now - this.lastAlertAt < 6000) return;
    const store = useLiveStore.getState();
    if (risk.level === "high") {
      this.lastAlertAt = now;
      const top = risk.drivers[0];
      store.pushAlert({
        id: `al-${Date.now()}`,
        t: Date.now(),
        level: "high",
        title: "High fall-risk detected",
        detail: `Score ${(risk.score * 100).toFixed(0)}% · primary driver: ${top.label.toLowerCase()}.`,
        status: "open",
      });
    } else if (risk.level === "mild" && Math.random() < 0.25) {
      this.lastAlertAt = now;
      store.pushAlert({
        id: `al-${Date.now()}`,
        t: Date.now(),
        level: "mild",
        title: "Gait deviation trending up",
        detail: `Mild-risk band entered · monitoring ${risk.drivers[0].label.toLowerCase()}.`,
        status: "open",
      });
    }
  }
}

// --- helpers ------------------------------------------------------------

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}
function sum(a: number[]) {
  return a.reduce((x, y) => x + y, 0);
}
function now01() {
  return (performance.now() / 1000) % 1;
}

/** Map global phase to a foot's stance fraction (0..1) or null if in swing. */
function phaseToStance(
  p: number,
  offset: number,
  stanceFrac: number
): number | null {
  let local = (p - offset + 1) % 1;
  if (local > stanceFrac) return null;
  return local / stanceFrac;
}

/**
 * MediaPipe Pose has 33 landmarks. We fill the ones the 3D view draws and leave
 * the rest as reasonable defaults, in normalized [x,y,z] (origin center, y-down).
 */
function buildSkeleton(
  swing: number,
  armAmp: number,
  sway: number,
  sev: number
): [number, number, number][] {
  const cx = 0.5 + sway;
  const pts: [number, number, number][] = new Array(33)
    .fill(0)
    .map(() => [cx, 0.5, 0]);

  const set = (i: number, x: number, y: number, z = 0) => (pts[i] = [x, y, z]);
  const legSwing = swing * 0.05;
  const armFwd = swing * armAmp;
  const stoop = sev * 0.03; // forward stoop with severity

  // Head / face
  set(0, cx, 0.12 + stoop, -stoop); // nose
  set(2, cx - 0.03, 0.11 + stoop, 0);
  set(5, cx + 0.03, 0.11 + stoop, 0);
  // Shoulders
  set(11, cx - 0.1, 0.26 + stoop, armFwd);
  set(12, cx + 0.1, 0.26 + stoop, -armFwd);
  // Elbows
  set(13, cx - 0.13, 0.4, armFwd * 1.6);
  set(14, cx + 0.13, 0.4, -armFwd * 1.6);
  // Wrists
  set(15, cx - 0.14, 0.53, armFwd * 2 + jitter(sev));
  set(16, cx + 0.14, 0.53, -armFwd * 2 + jitter(sev));
  // Hips
  set(23, cx - 0.07, 0.55, 0);
  set(24, cx + 0.07, 0.55, 0);
  // Knees
  set(25, cx - 0.08, 0.72, legSwing);
  set(26, cx + 0.08, 0.72, -legSwing);
  // Ankles
  set(27, cx - 0.08, 0.9, legSwing * 1.4);
  set(28, cx + 0.08, 0.9, -legSwing * 1.4);
  return pts;
}

/** Hand tremor proxy — grows with severity. */
function jitter(sev: number) {
  return sev > 0.55 ? (Math.random() - 0.5) * sev * 0.02 : 0;
}
