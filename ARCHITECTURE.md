# GaitGuard — System Architecture

AI-powered wearable insole + camera system that detects fall risk and early
Parkinsonian gait abnormalities by **fusing** two asynchronous sensor streams
into a live clinical risk classification: **Normal · Mild · High**.

---

## 1. Core insight

There are two asynchronous streams at different rates, and the product's value is
in *fusing* them:

- **Insole (ESP32):** high-frequency, low-dimensional numeric data (~50–100 Hz)
- **Vision (MediaPipe):** lower-frequency, high-dimensional landmark data (~15–30 Hz)

Fusion cannot happen in the browser, and MediaPipe must not run inside the API
server. So the system is **four independent processes** joined by a message layer.

```
ESP32 (FSR×4 + IMU) ──WS──▶ Insole ingest ─┐
                                            ▼
Webcam ──▶ Vision Worker (MediaPipe) ──WS──▶ FUSION ENGINE ──▶ PostgreSQL+Timescale
                                            │  align→features   │
                                            ▼  →risk model      ▼
                                        Redis Pub/Sub ◀─────────┘
                                            │ fan-out
                                            ▼
                                  WS Broadcast Hub ──WS──▶ Next.js dashboard
                                            ▲ REST (history/reports/auth)
                                            └────────────────────
```

> **Rule:** the browser never classifies. It renders state the backend computed —
> keeping risk logic auditable, which is non-negotiable for medical-grade software.

---

## 2. Components

| Process | Responsibility | Why separate |
|---|---|---|
| ESP32 firmware | Sample FSR×4 + IMU, timestamp, stream JSON over WS | Edge device |
| Vision Worker (Py) | OpenCV → MediaPipe Pose/Hands/FaceMesh → gait features | MediaPipe is heavy; isolate from API |
| Fusion Engine | Align streams, compute features, run risk model, persist, publish | The product IP; independently testable |
| API / Realtime (FastAPI) | Auth, REST, WS ingest + broadcast hub | Stateless, scalable |
| Next.js dashboard | Clinical UI | Presentation only |

---

## 3. Tech stack

**Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui ·
Recharts · react-three-fiber (3D skeleton) · Canvas 2D (pressure heatmap) ·
Zustand (live state).
**Backend:** FastAPI · Pydantic v2 · SQLAlchemy 2.0 (async) · Alembic.
**Fusion:** NumPy + rule engine → scikit-learn later.
**Data:** PostgreSQL + **TimescaleDB** (time-series hypertables) + **Redis**
(pub/sub, cache, WS fan-out).
**Auth:** JWT (access+refresh) + RBAC.
**Deploy:** Docker Compose → Vercel (web) · Fly/Render (api, vision) · Neon/
Timescale Cloud (db) · Upstash (redis).

The three additions beyond the base preference — Timescale, Redis, scikit-learn —
are what make it credible as hospital software (store 100 Hz data, fan out to many
clients, say "ML model" honestly).

---

## 4. Fusion engine

```
INGEST   insole → ring buffer A;  vision → ring buffer B (by timestamp)
ALIGN    sliding window 2s / stride 0.5s; resample onto a common clock
FEATURES insole: gait-cycle time, stance/swing, load balance L/R, cadence,
                 FSR asymmetry, IMU sway (RMS), freezing-of-gait index (FFT)
         vision: step length, stride symmetry, arm-swing amplitude, trunk sway,
                 double-support time, turning hesitation, tremor proxy
FUSE     concat → z-scored feature vector vs patient baseline
CLASSIFY score∈[0,1]; Normal<0.33≤Mild<0.66≤High; + confidence + top drivers
EMIT     publish → broadcast → persist
```

**v1 (now):** transparent weighted rule engine — no training data, demoable,
explainable. **v2:** RandomForest/GradientBoosting; expose `feature_importances_`
as the "drivers" the UI shows. Keep it a pure module (`packages/fusion`) so both
the API and vision worker import it and it unit-tests on recorded CSVs.

---

## 5. API

**REST:** auth (login/refresh/me) · patients (CRUD, search) · sessions
(start/stop/get/list) · trends · timeseries · reports (async PDF) · alerts.
**WebSocket:** `/ws/ingest/insole` · `/ws/ingest/vision` (device tokens) ·
`/ws/live/{session_id}` (dashboard, tagged messages: risk/sensor/pose/alert).

---

## 6. Database

**Relational:** users · patients · devices · sessions · risk_events · alerts ·
reports · **audit_log** (the clinical must-have).
**Timescale hypertables:** sensor_samples (100 Hz) · pose_frames · risk_scores
(+ continuous aggregate for instant multi-month trend queries).

---

## 7. Realtime

Each session = a Redis channel (`session:{id}`). Ingest publishes; the broadcast
hub subscribes and fans out to all dashboard sockets. Redis decouples workers →
run N Uvicorn workers, any client on any worker. Vision sends **landmarks**
(~2 KB), not video; live video is a separate WebRTC path (`aiortc`) if needed.

---

## 8. Auth & roles

JWT access (15 min) + rotating refresh (7 d), bcrypt. Roles: **Admin ·
Clinician · Caregiver · Patient**, enforced by a FastAPI dependency with org-level
row scoping. Every sensitive action → `audit_log`.

---

## 9. Dashboard pages

`/login` · `/` overview · `/patients` · `/patients/[id]` · **`/monitor/[sessionId]`
live cockpit** · `/trends` · `/reports` · `/alerts` · `/admin/*`.

**Live cockpit** = 3D skeleton · pressure heatmap · live sensors · risk gauge +
driver breakdown · risk timeline · alerts feed.

---

## 10. Monorepo layout

```
apps/web   (Next.js)   apps/api (FastAPI)   apps/vision (MediaPipe worker)
packages/fusion (pure rule engine)   packages/contracts (schemas→types)
firmware/esp32   infra/ (docker-compose)
```

---

## 11. Scalability

`org_id` on every table + process separation means scaling is config, not rewrite:
N stateless API workers via Redis; per-camera vision pods; queue-driven fusion
(NATS/Kafka) per patient; Timescale multi-node + read replicas; model registry
(MLflow) with versioning and drift monitoring.

---

## 12. Build order

1. Contracts + DB + auth 2. **Fusion engine on recorded CSV** (de-risk the hard
part) 3. WS ingest + broadcast + Redis 4. **Live cockpit** ← *current milestone,
built dashboard-first on a mock stream* 5. Real ESP32 + vision worker 6. History /
trends / reports / alerts.

---

## Current status

`apps/web` is built and running: the full Live Cockpit + Overview + roadmap pages,
driven by an in-browser mock stream (`src/lib/mockStream.ts`) that simulates a
walking patient drifting Normal → Mild → High and runs the same rule-based fusion
the real engine will. Wire contracts in `src/lib/types.ts` already match the
planned WebSocket payloads, so swapping mock → live backend is a transport change.
