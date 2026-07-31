/** Thin API client for the auth + session flow the Live Cockpit needs. */

import { API_BASE, DEMO_CREDS } from "./config";

let accessToken: string | null = null;

export function getToken() {
  return accessToken;
}

/** OAuth2 password login (form-encoded). Caches the access token in memory. */
export async function login(
  email = DEMO_CREDS.email,
  password = DEMO_CREDS.password,
  signal?: AbortSignal
): Promise<string> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal,
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token;
  return accessToken as string;
}

function authHeaders(): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/** Log in with demo creds if we don't already hold a token. */
export async function ensureToken(): Promise<string> {
  return accessToken ?? (await login());
}

/** Authenticated GET with a single silent re-auth on 401. */
export async function apiGet<T>(path: string): Promise<T> {
  await ensureToken();
  let res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) {
    accessToken = null;
    await ensureToken();
    res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  }
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Authenticated write (PATCH/POST/PUT/DELETE) with JSON body. */
export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  await ensureToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface SessionDto {
  id: string;
  patient_id: string;
  status: string;
}

export async function createSession(
  patientId: string,
  signal?: AbortSignal
): Promise<SessionDto> {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/sessions`, {
    method: "POST",
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(`createSession failed: ${res.status}`);
  return res.json();
}

/** Start the in-process demo simulator feeding this session on the server. */
export async function startSim(sessionId: string, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/simulate`, {
    method: "POST",
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(`startSim failed: ${res.status}`);
  return res.json();
}

/** Best-effort stop — uses keepalive so it still fires during page unload. */
export function stopSim(sessionId: string) {
  try {
    fetch(`${API_BASE}/api/sessions/${sessionId}/simulate`, {
      method: "DELETE",
      headers: authHeaders(),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
