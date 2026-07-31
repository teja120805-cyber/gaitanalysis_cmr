import { create } from "zustand";
import type {
  Alert,
  ConnState,
  InsoleFrame,
  PoseFrame,
  RiskUpdate,
} from "./types";

/** One downsampled point for the scrolling sensor charts. */
export interface SensorPoint {
  t: number;
  loadL: number; // total plantar load, left foot
  loadR: number; // total plantar load, right foot
  sway: number; // IMU sway magnitude (instability proxy)
}

/** One point on the risk timeline. */
export interface RiskPoint {
  t: number;
  score: number;
}

const SENSOR_CAP = 260;
const RISK_CAP = 360;
const ALERT_CAP = 40;

interface LiveState {
  conn: ConnState;

  // Latest raw frames — updated at full rate. Read via getState() in rAF loops;
  // do NOT subscribe to these in React or you re-render at 50 Hz.
  latestInsole: InsoleFrame | null;
  latestPose: PoseFrame | null;
  latestRisk: RiskUpdate | null;

  // Throttled, subscribe-friendly buffers.
  sensorBuf: SensorPoint[];
  riskBuf: RiskPoint[];
  alerts: Alert[];

  sessionStart: number;

  setConn: (c: ConnState) => void;
  setInsole: (f: InsoleFrame) => void;
  setPose: (f: PoseFrame) => void;
  pushSensor: (p: SensorPoint) => void;
  setRisk: (r: RiskUpdate) => void;
  pushRiskPoint: (p: RiskPoint) => void;
  pushAlert: (a: Alert) => void;
  ackAlert: (id: string) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  conn: "offline",
  latestInsole: null,
  latestPose: null,
  latestRisk: null,
  sensorBuf: [],
  riskBuf: [],
  alerts: [],
  sessionStart: Date.now(),

  setConn: (conn) => set({ conn }),
  setInsole: (latestInsole) => set({ latestInsole }),
  setPose: (latestPose) => set({ latestPose }),
  pushSensor: (p) =>
    set((s) => ({ sensorBuf: cap([...s.sensorBuf, p], SENSOR_CAP) })),
  setRisk: (latestRisk) => set({ latestRisk }),
  pushRiskPoint: (p) =>
    set((s) => ({ riskBuf: cap([...s.riskBuf, p], RISK_CAP) })),
  pushAlert: (a) =>
    set((s) => ({ alerts: [a, ...s.alerts].slice(0, ALERT_CAP) })),
  ackAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, status: "acknowledged" } : a
      ),
    })),
  reset: () =>
    set({
      latestInsole: null,
      latestPose: null,
      latestRisk: null,
      sensorBuf: [],
      riskBuf: [],
      alerts: [],
      sessionStart: Date.now(),
    }),
}));

function cap<T>(arr: T[], n: number): T[] {
  return arr.length > n ? arr.slice(arr.length - n) : arr;
}
