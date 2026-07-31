/**
 * Runtime configuration for talking to the GaitGuard API.
 *
 * NEXT_PUBLIC_API_BASE  — API origin (default http://localhost:8000)
 * NEXT_PUBLIC_USE_BACKEND — "1" force backend · "0" force mock · "auto" (default):
 *                           try the backend, fall back to the in-browser mock.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const WS_BASE = API_BASE.replace(/^http/i, "ws");

export const USE_BACKEND = (process.env.NEXT_PUBLIC_USE_BACKEND || "auto") as
  | "1"
  | "0"
  | "auto";

// Demo clinician login (seeded by the API). Demo build only.
export const DEMO_CREDS = {
  email: "clinician@gaitguard.health",
  password: "clinician123",
};

export const INGEST_TOKEN = "gaitguard-device-token";
