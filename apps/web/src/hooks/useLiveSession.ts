"use client";

import { useEffect, useState } from "react";
import { LiveClient } from "@/lib/liveClient";
import { createSession, getToken, login, stopSim } from "@/lib/api";
import { useLiveStore } from "@/lib/store";

export type LiveSource = "connecting" | "backend" | "offline";

export interface LiveState {
  source: LiveSource;
  sessionId: string | null;
}

/**
 * Connects a monitoring view to REAL backend data only — no simulator, no mock.
 *
 * - With `joinSessionId` (printed by the vision worker / a real device), it
 *   subscribes to that session's live channel.
 * - Without one, it creates a fresh session for the patient and subscribes; the
 *   cockpit stays in an "awaiting sensor data" state until a real device
 *   (ESP32 insole and/or the MediaPipe vision worker) streams into it.
 *
 * If the backend is unreachable the source is "offline" — the UI shows an honest
 * empty/offline state rather than fabricated motion.
 */
export function useLiveSession(patientId: string, joinSessionId?: string): LiveState {
  const [state, setState] = useState<LiveState>({
    source: "connecting",
    sessionId: joinSessionId ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    let live: LiveClient | null = null;
    let ownedSessionId: string | null = null;

    const boot = async () => {
      useLiveStore.getState().reset();
      useLiveStore.getState().setConn("connecting");

      try {
        // Best-effort auth (the live channel accepts anonymous in demo builds).
        let token: string | null = null;
        try {
          token = await login();
        } catch {
          token = null;
        }

        let sid = joinSessionId ?? null;
        if (!sid) {
          // Create a real session a device/worker can stream into. No simulator.
          const session = await createSession(patientId);
          sid = session.id;
          ownedSessionId = sid;
        }

        if (cancelled) {
          if (ownedSessionId) stopSim(ownedSessionId);
          return;
        }

        live = new LiveClient(sid, token ?? getToken());
        live.connect();
        setState({ source: "backend", sessionId: sid });
      } catch (err) {
        if (cancelled) return;
        console.error("[GaitGuard] backend unavailable — no live data", err);
        useLiveStore.getState().setConn("offline");
        setState({ source: "offline", sessionId: null });
      }
    };

    boot();

    return () => {
      cancelled = true;
      live?.close();
      // Only tear down a session we created (never a joined device session).
      if (ownedSessionId) stopSim(ownedSessionId);
    };
  }, [patientId, joinSessionId]);

  return state;
}
