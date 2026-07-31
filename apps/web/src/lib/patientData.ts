import type { Patient, RiskLevel } from "./types";
import { getPatient } from "./patients";

/**
 * Deterministic dummy clinical detail per patient, so profile/report pages look
 * populated without a backend. Seeded from the patient id for stable output.
 */

function seeded(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return () => {
    h = (h * 1103515245 + 12345) % 2147483648;
    return h / 2147483648;
  };
}

export interface WalkingSession {
  id: string;
  date: string;
  duration: string;
  steps: number;
  peak: RiskLevel;
  avgCadence: number;
  symmetry: number;
}

export interface TimelineEvent {
  t: string;
  kind: "session" | "alert" | "report" | "note" | "admit";
  title: string;
  detail: string;
  level?: RiskLevel;
}

export interface PatientReportMeta {
  id: string;
  title: string;
  date: string;
  peak: RiskLevel;
  status: "final" | "draft";
}

export interface PatientDetailData {
  patient: Patient;
  doctor: string;
  admitted: string;
  devices: { name: string; type: string; status: "online" | "offline"; battery: string }[];
  vitals: { label: string; value: string; unit?: string; tone?: RiskLevel }[];
  sessions: WalkingSession[];
  pressureHistory: { label: string; value: number }[];
  riskHistory: { label: string; value: number }[];
  timeline: TimelineEvent[];
  history: { date: string; title: string; detail: string }[];
  reports: PatientReportMeta[];
}

const DOCTORS = ["Dr. R. Okonkwo", "Dr. A. Lindqvist", "Dr. M. Haddad", "Dr. S. Fernández"];
const LEVELS: RiskLevel[] = ["normal", "mild", "high"];

export function getPatientDetail(id: string): PatientDetailData | null {
  const patient = getPatient(id);
  if (!patient) return null;
  const rnd = seeded(id);

  const base = patient.baselineRisk === "high" ? 0.6 : patient.baselineRisk === "mild" ? 0.4 : 0.2;

  const sessions: WalkingSession[] = Array.from({ length: 8 }, (_, i) => {
    const r = rnd();
    return {
      id: `${id}-s${i}`,
      date: dateNDaysAgo(i * 2 + 1),
      duration: `${18 + Math.floor(r * 24)} min`,
      steps: 320 + Math.floor(r * 900),
      peak: LEVELS[Math.min(2, Math.floor(base * 3 + r))],
      avgCadence: Math.round(94 + r * 18),
      symmetry: Math.round(78 + r * 18),
    };
  });

  const pressureHistory = Array.from({ length: 14 }, (_, i) => ({
    label: `D${i + 1}`,
    value: Math.round((base + (rnd() - 0.5) * 0.2 + i * 0.005) * 100),
  }));
  const riskHistory = Array.from({ length: 30 }, (_, i) => ({
    label: `D${i + 1}`,
    value: Math.round(Math.max(6, Math.min(94, (base + (rnd() - 0.5) * 0.25 + i * 0.004) * 100))),
  }));

  const timeline: TimelineEvent[] = [
    { t: "Today · 09:12", kind: "alert", title: "Risk band changed", detail: `Entered ${patient.baselineRisk} band during morning walk`, level: patient.baselineRisk },
    { t: "Today · 08:40", kind: "session", title: "Walking session", detail: "22-min corridor assessment · 640 steps" },
    { t: "Yesterday", kind: "report", title: "Report finalized", detail: "Weekly gait analysis signed off" },
    { t: "2 days ago", kind: "note", title: "Clinician note", detail: "Adjusted levodopa timing; monitor freezing episodes" },
    { t: dateNDaysAgo(9), kind: "admit", title: "Admitted", detail: `${patient.condition}` },
  ];

  const history = [
    { date: "2024", title: "Parkinson's diagnosis", detail: "Hoehn & Yahr stage II confirmed" },
    { date: "2025", title: "Prior fall", detail: "Non-injurious fall at home; referred to gait clinic" },
    { date: "2026", title: "Enrolled in GaitGuard", detail: "Continuous insole + vision monitoring started" },
  ];

  const reports: PatientReportMeta[] = [
    { id: `rep-${id}-1`, title: "Fall-risk assessment", date: dateNDaysAgo(1), peak: patient.baselineRisk, status: "final" },
    { id: `rep-${id}-2`, title: "Weekly gait analysis", date: dateNDaysAgo(8), peak: "mild", status: "final" },
    { id: `rep-${id}-3`, title: "Freezing episode review", date: dateNDaysAgo(15), peak: "high", status: "draft" },
  ];

  return {
    patient,
    doctor: DOCTORS[Math.floor(rnd() * DOCTORS.length)],
    admitted: dateNDaysAgo(9),
    devices: [
      { name: "Insole · Left", type: "ESP32 · 4×FSR + IMU", status: "online", battery: `${72 + Math.floor(rnd() * 24)}%` },
      { name: "Insole · Right", type: "ESP32 · 4×FSR + IMU", status: "online", battery: `${70 + Math.floor(rnd() * 24)}%` },
      { name: "Vision camera", type: "MediaPipe Pose", status: rnd() > 0.15 ? "online" : "offline", battery: "—" },
    ],
    vitals: [
      { label: "Cadence", value: `${Math.round(96 + rnd() * 14)}`, unit: "spm" },
      { label: "Symmetry", value: `${Math.round(80 + rnd() * 14)}`, unit: "%", tone: patient.baselineRisk },
      { label: "Stride var.", value: `${(2 + rnd() * 4).toFixed(1)}`, unit: "%" },
      { label: "Falls (90d)", value: `${Math.floor(rnd() * 3)}` },
    ],
    sessions,
    pressureHistory,
    riskHistory,
    timeline,
    history,
    reports,
  };
}

function dateNDaysAgo(n: number) {
  const d = new Date(2026, 6, 27);
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
