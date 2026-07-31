import { getPatient, PATIENTS } from "./patients";
import type { Patient, RiskLevel } from "./types";

/** Resolve a full medical report from a report id of the form `rep-<patientId>-<n>`. */

export interface GaitMetric {
  metric: string;
  value: string;
  normal: string;
  flag: "normal" | "borderline" | "abnormal";
}

export interface ReportData {
  id: string;
  patient: Patient;
  title: string;
  type: string;
  date: string;
  clinician: string;
  peak: RiskLevel;
  score: number;
  confidence: number;
  session: { duration: string; steps: number; distance: string; falls: number };
  pressure: { leftPct: number; rightPct: number; peakKpa: number; copPathCm: number };
  gait: GaitMetric[];
  abnormalities: { title: string; detail: string; level: RiskLevel }[];
  riskTrend: { label: string; value: number }[];
  cadenceTrend: { label: string; value: number }[];
  recommendations: string[];
  notes: string;
}

function seeded(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return () => ((h = (h * 1103515245 + 12345) % 2147483648) / 2147483648);
}

function patientFromReportId(reportId: string): Patient {
  // rep-pt-3390-1  ->  pt-3390
  const m = reportId.match(/^rep-(pt-\d+)-\d+$/);
  if (m) {
    const p = getPatient(m[1]);
    if (p) return p;
  }
  return PATIENTS[0];
}

export function getReport(reportId: string): ReportData {
  const patient = patientFromReportId(reportId);
  const rnd = seeded(reportId);
  const base = patient.baselineRisk === "high" ? 62 : patient.baselineRisk === "mild" ? 41 : 20;
  const score = Math.round(base + (rnd() - 0.5) * 12);
  const leftPct = Math.round(46 + (rnd() - 0.5) * 10);

  const flag = (v: number, lo: number, hi: number): GaitMetric["flag"] =>
    v < lo || v > hi ? "abnormal" : v < lo * 1.1 || v > hi * 0.9 ? "borderline" : "normal";

  const cadence = Math.round(96 + rnd() * 16);
  const strideVar = +(2 + rnd() * 6).toFixed(1);
  const sym = Math.round(78 + rnd() * 16);
  const trunk = +(2 + rnd() * 7).toFixed(1);
  const dbl = Math.round(18 + rnd() * 14);

  return {
    id: reportId,
    patient,
    title: "Gait & Fall-Risk Assessment",
    type: "Comprehensive walking-session report",
    date: new Date(2026, 6, 27).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    clinician: "Dr. R. Okonkwo · Neurology",
    peak: patient.baselineRisk,
    score,
    confidence: Math.round(82 + rnd() * 14),
    session: { duration: `${20 + Math.floor(rnd() * 20)} min`, steps: 480 + Math.floor(rnd() * 700), distance: `${(0.3 + rnd() * 0.6).toFixed(2)} km`, falls: Math.floor(rnd() * 2) },
    pressure: { leftPct, rightPct: 100 - leftPct, peakKpa: Math.round(180 + rnd() * 120), copPathCm: +(8 + rnd() * 10).toFixed(1) },
    gait: [
      { metric: "Cadence", value: `${cadence} spm`, normal: "100–120 spm", flag: flag(cadence, 100, 120) },
      { metric: "Stride variability", value: `${strideVar} %`, normal: "< 3 %", flag: strideVar > 3 ? "abnormal" : "normal" },
      { metric: "Step-length symmetry", value: `${sym} %`, normal: "> 90 %", flag: sym < 90 ? (sym < 80 ? "abnormal" : "borderline") : "normal" },
      { metric: "Trunk sway", value: `${trunk}°`, normal: "< 3°", flag: trunk > 3 ? "abnormal" : "normal" },
      { metric: "Double-support time", value: `${dbl} %`, normal: "18–26 %", flag: flag(dbl, 18, 26) },
      { metric: "Arm-swing symmetry", value: `${Math.round(70 + rnd() * 24)} %`, normal: "> 85 %", flag: "borderline" },
    ],
    abnormalities: buildAbnormalities(patient.baselineRisk),
    riskTrend: Array.from({ length: 12 }, (_, i) => ({ label: `W${i + 1}`, value: Math.round(Math.max(6, Math.min(94, base + (rnd() - 0.5) * 20 + i * 1.2))) })),
    cadenceTrend: Array.from({ length: 12 }, (_, i) => ({ label: `W${i + 1}`, value: Math.round(cadence + (rnd() - 0.5) * 10 - i * 0.4) })),
    recommendations: buildRecommendations(patient.baselineRisk),
    notes:
      "Patient tolerated the assessment well. Gait pattern consistent with prior sessions; " +
      "recommend continued insole + vision monitoring and physiotherapy review in 2 weeks.",
  };
}

function buildAbnormalities(level: RiskLevel) {
  if (level === "high")
    return [
      { title: "Freezing of gait", detail: "3 episodes detected during turns; festination on initiation.", level: "high" as RiskLevel },
      { title: "Marked load asymmetry", detail: "Right-side push-off reduced; lateral instability.", level: "high" as RiskLevel },
      { title: "Elevated trunk sway", detail: "Medio-lateral sway above threshold during ambulation.", level: "mild" as RiskLevel },
    ];
  if (level === "mild")
    return [
      { title: "Reduced arm swing", detail: "Left arm-swing amplitude below age-matched norm.", level: "mild" as RiskLevel },
      { title: "Cadence slowing", detail: "Cadence trending below baseline over the session.", level: "mild" as RiskLevel },
    ];
  return [{ title: "No significant abnormalities", detail: "Gait parameters within normal limits.", level: "normal" as RiskLevel }];
}

function buildRecommendations(level: RiskLevel) {
  const common = [
    "Continue continuous insole + vision monitoring.",
    "Home environment fall-proofing review (rugs, lighting, grab rails).",
  ];
  if (level === "high")
    return [
      "Initiate supervised gait & balance physiotherapy (twice weekly).",
      "Medication timing review with neurology re: freezing episodes.",
      "Consider assistive device (rollator) for corridor ambulation.",
      ...common,
    ];
  if (level === "mild")
    return ["Targeted arm-swing and cadence retraining exercises.", "Re-assess in 2 weeks.", ...common];
  return ["Routine 4-week re-assessment.", ...common];
}
