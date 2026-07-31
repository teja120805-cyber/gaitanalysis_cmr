/**
 * LiveClient — subscribes to the backend's per-session broadcast channel and
 * routes tagged messages into the same zustand store the mock stream feeds, so
 * the entire cockpit is transport-agnostic. Handles sensor-buffer downsampling
 * and lightweight reconnection.
 */

import { WS_BASE } from "./config";
import { useLiveStore } from "./store";
import type { InsoleFrame, PoseFrame, RiskUpdate, Alert } from "./types";

const SENSOR_PUSH_MS = 80; // ~12.5 Hz into the chart buffer

export class LiveClient {
  private ws: WebSocket | null = null;
  private closed = false;
  private lastSensor = 0;
  private retries = 0;

  constructor(private sessionId: string, private token: string | null) {}

  connect() {
    const q = this.token ? `?token=${encodeURIComponent(this.token)}` : "";
    const url = `${WS_BASE}/ws/live/${this.sessionId}${q}`;
    const store = useLiveStore.getState();
    store.setConn(this.retries ? "reconnecting" : "connecting");

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.retries = 0;
      useLiveStore.getState().setConn("live");
    };
    ws.onmessage = (ev) => this.route(ev.data);
    ws.onclose = () => this.onDrop();
    ws.onerror = () => ws.close();
  }

  private route(raw: string) {
    let msg: { type: string; payload: unknown };
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const store = useLiveStore.getState();

    switch (msg.type) {
      case "insole": {
        const f = msg.payload as InsoleFrame;
        store.setInsole(f);
        const now = performance.now();
        if (now - this.lastSensor >= SENSOR_PUSH_MS) {
          this.lastSensor = now;
          const loadL = f.fsr.left.reduce((a, b) => a + b, 0);
          const loadR = f.fsr.right.reduce((a, b) => a + b, 0);
          const sway = Math.hypot(f.imu.ax, f.imu.ay) + Math.abs(f.imu.gz) / 90;
          store.pushSensor({ t: Date.now(), loadL, loadR, sway });
        }
        break;
      }
      case "pose":
        store.setPose(msg.payload as PoseFrame);
        break;
      case "risk": {
        const r = msg.payload as RiskUpdate;
        store.setRisk(r);
        store.pushRiskPoint({ t: Date.now(), score: r.score });
        break;
      }
      case "alert": {
        const a = msg.payload as Alert;
        store.pushAlert({ ...a, status: a.status ?? "open" });
        break;
      }
      case "conn":
        // server hello — connection confirmed in onopen already
        break;
    }
  }

  private onDrop() {
    if (this.closed) return;
    const store = useLiveStore.getState();
    if (this.retries >= 4) {
      store.setConn("offline");
      return;
    }
    this.retries += 1;
    store.setConn("reconnecting");
    setTimeout(() => {
      if (!this.closed) this.connect();
    }, Math.min(4000, 600 * this.retries));
  }

  close() {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
  }
}
