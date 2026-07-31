"use client";

import { useEffect, useState } from "react";
import { MockStream } from "@/lib/mockStream";
import { LiveClient } from "@/lib/liveClient";
import { createSession, getToken, login, startSim, stopSim } from "@/lib/api";
import { USE_BACKEND } from "@/lib/config";
import { useLiveStore } from "@/lib/store";

export type LiveSource = "connecting" | "backend" | "simulated";

/**
 * Drives a monitoring view. Tries the real backend (login → create session →
 * start server-side simulator → subscribe to the live WS); if the backend is
 * unreachable and mode is "auto", falls back to the in-browser mock so the demo
 * always runs. Returns which source is active for optional UI hinting.
 */
export function useLiveSession(patientId: string): LiveSource {
  const [source, setSource] = useState<LiveSource>("connecting");

  useEffect(() => {
    let cancelled = false;
    let mock: MockStream | null = null;
    let live: LiveClient | null = null;
    let sessionId: string | null = null;

    const startMock = () => {
      if (cancelled) return;
      mock = new MockStream();
      mock.start();
      setSource("simulated");
    };

    const boot = async () => {
      useLiveStore.getState().reset();

      if (USE_BACKEND === "0") {
        startMock();
        return;
      }

      try {
        useLiveStore.getState().setConn("connecting");
        await login();
        const session = await createSession(patientId);
        sessionId = session.id;
        await startSim(session.id);

        // A cleanup may have fired while we were awaiting — undo and bail.
        if (cancelled) {
          stopSim(session.id);
          return;
        }

        live = new LiveClient(session.id, getToken());
        live.connect();
        setSource("backend");
      } catch (err) {
        if (cancelled) return;
        if (USE_BACKEND === "1") {
          console.error("[GaitGuard] backend required but unavailable", err);
          useLiveStore.getState().setConn("offline");
          return;
        }
        console.warn("[GaitGuard] backend unavailable — using local simulation", err);
        startMock();
      }
    };

    boot();

    return () => {
      cancelled = true;
      mock?.stop();
      live?.close();
      if (sessionId) stopSim(sessionId);
    };
  }, [patientId]);

  return source;
}
