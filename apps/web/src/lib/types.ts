/**
 * Wire contracts. These intentionally mirror what the FastAPI WebSocket hub will
 * emit, so replacing the mock stream with a real socket is a transport swap only.
 * Keep in sync with packages/contracts when the backend lands.
 */

export type RiskLevel = "normal" | "mild" | "high";

/** One insole frame from the ESP32 (4× FSR + 6-axis IMU). ~50 Hz. */
export interface InsoleFrame {
  t: number; // epoch ms
  /** Force-sensitive resistors, normalized 0..1 — [heel, lateral, medial, toe] per foot. */
  fsr: {
    left: [number, number, number, number];
    right: [number, number, number, number];
  };
  imu: {
    ax: number;
    ay: number;
    az: number; // g
    gx: number;
    gy: number;
    gz: number; // deg/s
  };
}

/** One vision frame from the MediaPipe worker. ~30 Hz. */
export interface PoseFrame {
  t: number;
  /** Normalized [x, y, z] landmarks, MediaPipe Pose index order (33 points). */
  landmarks: [number, number, number][];
  metrics: {
    cadence: number; // steps/min
    stepLengthSym: number; // 0..1 (1 = symmetric)
    armSwingSym: number; // 0..1
    trunkSway: number; // degrees
    doubleSupport: number; // % of gait cycle
  };
}

/** A single feature that contributed to the current risk score (explainability). */
export interface RiskDriver {
  key: string;
  label: string;
  /** Contribution to the score, 0..1. */
  weight: number;
  source: "insole" | "vision" | "fusion";
}

/** The fused risk assessment the Fusion Engine publishes. ~2 Hz. */
export interface RiskUpdate {
  t: number;
  level: RiskLevel;
  score: number; // 0..1
  confidence: number; // 0..1
  drivers: RiskDriver[];
}

export interface Alert {
  id: string;
  t: number;
  level: RiskLevel;
  title: string;
  detail: string;
  status: "open" | "acknowledged";
}

export type ConnState = "connecting" | "live" | "reconnecting" | "offline";

/** The tagged messages the live channel carries. */
export type LiveMessage =
  | { type: "insole"; payload: InsoleFrame }
  | { type: "pose"; payload: PoseFrame }
  | { type: "risk"; payload: RiskUpdate }
  | { type: "alert"; payload: Alert }
  | { type: "conn"; payload: ConnState };

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  sex: "M" | "F";
  room: string;
  condition: string;
  baselineRisk: RiskLevel;
}
