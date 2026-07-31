import type { Patient } from "./types";

/** Demo roster. Replaced by GET /api/patients when the backend lands. */
export const PATIENTS: Patient[] = [
  {
    id: "pt-1042",
    mrn: "MRN-1042",
    name: "Eleanor Whitfield",
    age: 74,
    sex: "F",
    room: "Neuro-3B · 312",
    condition: "Parkinson's (H&Y II) · post-fall monitoring",
    baselineRisk: "mild",
  },
  {
    id: "pt-2071",
    mrn: "MRN-2071",
    name: "Marcus Bell",
    age: 68,
    sex: "M",
    room: "Neuro-3B · 318",
    condition: "Gait instability · balance assessment",
    baselineRisk: "normal",
  },
  {
    id: "pt-3390",
    mrn: "MRN-3390",
    name: "Priya Nadar",
    age: 81,
    sex: "F",
    room: "Rehab-2 · 204",
    condition: "Recurrent falls · vestibular workup",
    baselineRisk: "high",
  },
  {
    id: "pt-4415",
    mrn: "MRN-4415",
    name: "Daniel Okafor",
    age: 71,
    sex: "M",
    room: "Neuro-3B · 305",
    condition: "Early Parkinsonism · freezing episodes",
    baselineRisk: "mild",
  },
];

export function getPatient(id: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === id);
}
