<div align="center">

<img src="docs/assets/banner.png" alt="GaitGuard banner" width="820" onerror="this.style.display='none'"/>

# 🦶 GaitGuard

### AI‑Powered Smart Gait Analysis & Fall‑Risk Prediction Platform

*Fusing wearable insole sensors and computer‑vision pose tracking into a real‑time, explainable fall‑risk assessment for clinicians.*

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-1d4ed8.svg?style=flat-square)](#-license)
[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TimescaleDB](https://img.shields.io/badge/TimescaleDB-2.x-FDB515?style=flat-square&logo=timescale&logoColor=black)](https://www.timescale.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-6f42c1?style=flat-square)](#-realtime-streaming)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-16a34a?style=flat-square)](#-contributing)
[![Status](https://img.shields.io/badge/status-active%20development-f59e0b?style=flat-square)](#-project-status--honesty-note)

</div>

---

> [!IMPORTANT]
> ## 📌 Project status & honesty note
>
> GaitGuard is an **active, working prototype** built for a hackathon and evolving toward a production platform. To keep this document trustworthy, every capability below is tagged with an **implementation status**:
>
> | Badge | Meaning |
> |------|---------|
> | ✅ **Implemented** | Built, running, and verified in this repository today |
> | 🔶 **Partial** | Scaffolding/foundations exist; not feature‑complete |
> | 🔮 **Planned** | Designed and documented as a roadmap item; **not yet in the codebase** |
>
> In particular, the **Doctor Assistant AI, Retrieval‑Augmented Generation (RAG), ChromaDB vector store, LLM integration, and trained ML models** described in later sections are marked **🔮 Planned**. The **shipping** risk engine is a **transparent, rule‑based fusion model** (no LLM, no vector DB). We document the AI/RAG vision because it is central to the roadmap — but we never present it as already built.

---

## 🧭 Table of Contents

<details open>
<summary><b>Click to expand / collapse</b></summary>

1. [Project Vision](#-1--project-vision)
2. [Features](#-2--features)
3. [Architecture](#-3--architecture)
4. [Technology Stack](#-4--technology-stack)
5. [Folder Structure](#-5--folder-structure)
6. [Installation](#-6--installation)
7. [Environment Variables](#-7--environment-variables)
8. [Backend](#-8--backend)
9. [Frontend](#-9--frontend)
10. [Realtime Streaming](#-realtime-streaming)
11. [The Fusion Engine (Risk Model)](#-10--the-fusion-engine-risk-model)
12. [AI Pipeline (Planned)](#-11--ai-pipeline--planned)
13. [Doctor Assistant AI (Planned)](#-12--doctor-assistant-ai--planned)
14. [Machine Learning](#-13--machine-learning)
15. [Database Design](#-14--database-design)
16. [API Documentation](#-15--api-documentation)
17. [Security](#-16--security)
18. [Explainable AI](#-17--explainable-ai)
19. [Screenshots](#-18--screenshots)
20. [Performance](#-19--performance)
21. [Docker](#-20--docker)
22. [Testing](#-21--testing)
23. [Deployment](#-22--deployment)
24. [Future Roadmap](#-23--future-roadmap)
25. [Contributing](#-24--contributing)
26. [License](#-license)
27. [Authors](#-25--authors)
28. [Acknowledgements](#-26--acknowledgements)
29. [FAQ](#-27--faq)
30. [Troubleshooting](#-28--troubleshooting)
31. [Conclusion](#-29--conclusion)

</details>

---

## 🎯 1 · Project Vision

### Why GaitGuard exists

Falls are the **leading cause of injury‑related death** in adults over 65 and a primary driver of loss of independence. In neurological conditions such as **Parkinson's disease**, subtle gait changes — reduced arm swing, shuffling, festination, freezing of gait, asymmetric loading — often appear **weeks before** a serious fall, yet they are hard to catch during a 15‑minute clinic visit.

The problem is **observability**. Clinicians see a snapshot; deterioration happens continuously, at home and on the ward. GaitGuard closes that gap by turning two inexpensive, complementary sensor streams into a **continuous, explainable risk signal** that a care team can actually act on.

### Why gait analysis matters

Gait is a **whole‑body biomarker**. It integrates the motor, sensory, vestibular, and cognitive systems, which is why quantitative gait metrics correlate strongly with fall risk and disease progression:

| Signal | What it reveals |
|--------|-----------------|
| **Cadence & stride time** | Bradykinesia, festination, fatigue |
| **Plantar load asymmetry (L/R)** | Compensation, weakness, one‑sided instability |
| **Center of Pressure (CoP) sway** | Balance control, postural instability |
| **Double‑support time** | Cautious gait, fear of falling |
| **Arm‑swing amplitude/symmetry** | Early Parkinsonism |
| **Trunk sway** | Medio‑lateral instability |
| **Freezing / festination index** | Acute high‑risk episodes |

### Clinical motivation & real‑world impact

- **Earlier intervention** — flag deterioration before a fall, not after.
- **Objective, longitudinal data** — replace subjective "how's your walking?" with trends.
- **Explainability first** — every risk score names *why*, so a clinician can trust and audit it.
- **Low‑cost hardware** — an ESP32 + four force‑sensitive resistors + IMU + a webcam, not a $100k gait lab.

> [!NOTE]
> GaitGuard is a **clinical decision‑support** tool. It augments — it does not replace — professional medical judgment. It is a research/prototype system and is **not** a certified medical device.

---

## ✨ 2 · Features

Legend: ✅ Implemented · 🔶 Partial · 🔮 Planned

| # | Feature | Status | Description |
|---|---------|:------:|-------------|
| 1 | **Real‑time fall‑risk scoring** | ✅ | 2 Hz fused `Normal · Mild · High` classification from live sensors |
| 2 | **Explainable AI (driver breakdown)** | ✅ | Every score ships ranked, weighted contributors tagged by source stream |
| 3 | **Live Monitoring cockpit** | ✅ | Camera + 3D skeleton, pressure heatmap, CoP, sensor values, detected events |
| 4 | **Plantar pressure heatmap** | ✅ | Canvas‑rendered 4‑FSR‑per‑foot pressure map on a PACS‑style viewport |
| 5 | **Center of Pressure (CoP) trajectory** | ✅ | Weighted‑centroid sway path with fading trail |
| 6 | **Gait‑event detection** | ✅ | Heel‑strike, toe‑off, stride variability, fall watch — derived live |
| 7 | **3D skeleton tracking** | ✅ | `react‑three‑fiber` pose figure, recolored by risk level |
| 8 | **Historical trends & analytics** | ✅ | Longitudinal charts, Day/Week/Month/Year, PNG + PDF export |
| 9 | **Patient management** | ✅ | Directory, search, filter, grid/list, full patient profile |
| 10 | **Medical report generation** | ✅ | Printable hospital‑grade report with PDF/CSV/print export |
| 11 | **Alerts & triage** | ✅ | Typed alerts, priority, notification drawer, ack/resolve, email/SMS hooks |
| 12 | **Secure authentication** | ✅ | JWT access + refresh, bcrypt password hashing |
| 13 | **Role‑Based Access Control** | ✅ | Admin · Clinician · Caregiver · Patient |
| 14 | **Analytics dashboard** | ✅ | Fleet KPIs, risk distribution, device status, weekly/monthly charts |
| 15 | **Realtime device ingest** | ✅ | ESP32 + vision worker stream over WebSockets → server fusion |
| 16 | **Dark mode & responsive design** | ✅ | Light/dark themes, mobile drawer, glassmorphic chrome |
| 17 | **TimescaleDB time‑series storage** | 🔶 | Hypertables auto‑created on Postgres; SQLite fallback for dev |
| 18 | **Audit logging** | 🔶 | Sensitive‑action logging designed; partial coverage |
| 19 | **Balance & physiotherapy tracking** | 🔶 | Metrics captured; dedicated PT workflow is roadmap |
| 20 | **AI Recommendations** | 🔮 | Rule‑based recommendations in reports; LLM‑generated planned |
| 21 | **Doctor Assistant AI (RAG)** | 🔮 | Natural‑language Q&A over patient records — designed, not built |
| 22 | **Medical RAG + Vector DB (ChromaDB)** | 🔮 | Embedding + retrieval pipeline — roadmap |
| 23 | **Trained ML risk models** | 🔮 | Gradient‑boosted classifier to replace/augment the rule engine |

---

## 🏗️ 3 · Architecture

GaitGuard is a **four‑process system** joined by a realtime message layer. The core insight: two asynchronous sensor streams at different rates must be **fused server‑side** — never in the browser, and never inside the API request path.

### 3.1 Overall architecture

```mermaid
flowchart TD
    subgraph Edge["🧦 Edge Devices"]
        ESP["ESP32 Insole<br/>4× FSR + 6‑axis IMU<br/>~50 Hz"]
        CAM["Camera + MediaPipe<br/>Pose landmarks<br/>~30 Hz"]
    end

    subgraph Backend["⚙️ FastAPI Backend"]
        INGEST["WS Ingest<br/>/ws/ingest/insole<br/>/ws/ingest/vision"]
        FUSION["Fusion Engine<br/>align → features → rule model<br/>2 Hz assessment"]
        HUB["Broadcast Hub<br/>Redis or in‑process pub/sub"]
        REST["REST API<br/>auth · patients · sessions<br/>alerts · analytics · reports"]
    end

    subgraph Data["🗄️ Data Layer"]
        PG["PostgreSQL<br/>relational core"]
        TS["TimescaleDB<br/>risk_scores · sensor_samples"]
        RD["Redis<br/>pub/sub + cache"]
    end

    subgraph Planned["🔮 Planned AI Layer"]
        VEC["ChromaDB<br/>vector store"]
        LLM["LLM<br/>Doctor Assistant"]
    end

    subgraph Client["🖥️ Next.js Dashboard"]
        COCKPIT["Live Cockpit"]
        PAGES["Dashboard · Patients<br/>Analytics · Reports · Alerts"]
    end

    ESP -- JSON/WS --> INGEST
    CAM -- JSON/WS --> INGEST
    INGEST --> FUSION
    FUSION --> HUB
    FUSION --> TS
    REST --> PG
    REST --> TS
    HUB <--> RD
    HUB -- WS --> COCKPIT
    REST -- HTTPS --> PAGES
    PG -.embeddings.-> VEC
    VEC -.retrieval.-> LLM
    LLM -.answers.-> PAGES

    classDef planned fill:#fff7ed,stroke:#f59e0b,stroke-dasharray:5 5;
    class Planned,VEC,LLM planned;
```

> [!NOTE]
> The dashed **Planned AI Layer** (ChromaDB + LLM) is not yet implemented. Everything else in the diagram runs today.

### 3.2 Live session sequence

```mermaid
sequenceDiagram
    participant B as Browser (Cockpit)
    participant API as FastAPI
    participant SIM as Demo Simulator / ESP32
    participant FE as Fusion Engine
    participant HUB as Broadcast Hub
    participant DB as Database

    B->>API: POST /api/auth/login (demo creds)
    API-->>B: access + refresh JWT
    B->>API: POST /api/patients/{id}/sessions
    API-->>B: { session_id }
    B->>API: POST /api/sessions/{id}/simulate
    API->>SIM: start in‑process feeder
    B->>HUB: WS connect /ws/live/{session_id}
    loop every 20 ms (insole) / 33 ms (pose)
        SIM->>FE: add_insole() / add_pose()
        SIM->>HUB: publish {type: insole|pose}
        HUB-->>B: sensor + pose frames
    end
    loop every 500 ms
        FE->>FE: assess() over 2 s window
        FE->>DB: persist risk_score
        FE->>HUB: publish {type: risk}
        HUB-->>B: risk + drivers + confidence
        alt level == HIGH
            FE->>DB: insert Alert + Notification
            FE->>HUB: publish {type: alert}
            HUB-->>B: alert toast
        end
    end
```

### 3.3 Data fusion flow

```mermaid
flowchart LR
    A["Insole ring buffer<br/>(400 samples)"] --> C{"Align<br/>2 s window<br/>0.5 s stride"}
    B["Pose ring buffer<br/>(200 samples)"] --> C
    C --> D["Feature extraction<br/>load_asym · sway · freeze<br/>arm_swing · cadence · double_support"]
    D --> E["Weighted rule engine<br/>Σ (feature × weight)"]
    E --> F["Score ∈ [0,1]"]
    F --> G{"Threshold"}
    G -->|"< 0.33"| N["🟢 Normal"]
    G -->|"0.33–0.66"| M["🟡 Mild"]
    G -->|"≥ 0.66"| H["🔴 High"]
    E --> I["Ranked drivers<br/>+ confidence"]
```

---

## 🧰 4 · Technology Stack

<table>
<tr><th>Layer</th><th>Technologies</th><th>Status</th></tr>

<tr><td><b>Frontend</b></td><td>Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3</td><td>✅</td></tr>
<tr><td><b>Visualization</b></td><td>Recharts, Canvas 2D (heatmap/CoP), <code>react‑three‑fiber</code> + Three.js (3D skeleton)</td><td>✅</td></tr>
<tr><td><b>UX / Motion</b></td><td>Framer Motion, next‑themes (dark mode), lucide‑react, Zustand (live state)</td><td>✅</td></tr>
<tr><td><b>Backend</b></td><td>FastAPI, Uvicorn, Pydantic v2, Python 3.9+</td><td>✅</td></tr>
<tr><td><b>Realtime</b></td><td>WebSockets (Starlette), Redis pub/sub (with in‑process fallback)</td><td>✅</td></tr>
<tr><td><b>Computer vision</b></td><td>MediaPipe Pose + OpenCV vision worker (<code>apps/vision</code>) streaming 33 landmarks + gait metrics</td><td>✅</td></tr>
<tr><td><b>Risk model</b></td><td><code>gaitguard_fusion</code> — pure‑Python weighted rule engine (NumPy‑free, dependency‑free)</td><td>✅</td></tr>
<tr><td><b>Database</b></td><td>PostgreSQL 16 + TimescaleDB (hypertables); SQLite + aiosqlite for zero‑infra dev</td><td>✅</td></tr>
<tr><td><b>ORM</b></td><td>SQLAlchemy 2.0 (async), asyncpg / aiosqlite drivers</td><td>✅</td></tr>
<tr><td><b>Auth</b></td><td>python‑jose (JWT), passlib + bcrypt, OAuth2 password flow, RBAC</td><td>✅</td></tr>
<tr><td><b>DevOps / Deploy</b></td><td>Docker, Docker Compose (web · api · timescaledb · redis)</td><td>✅</td></tr>
<tr><td><b>Testing</b></td><td>Pytest (fusion smoke tests), <code>tsc</code> type‑checking, httpx/websockets integration scripts</td><td>🔶</td></tr>
<tr><td><b>Migrations</b></td><td>SQL DDL (<code>infra/schema.sql</code>); Alembic</td><td>🔶</td></tr>
<tr><td><b>AI / LLM</b></td><td>OpenAI / local LLM, prompt orchestration, Doctor Assistant</td><td>🔮</td></tr>
<tr><td><b>Vector DB</b></td><td>ChromaDB, sentence‑transformers embeddings</td><td>🔮</td></tr>
<tr><td><b>ML training</b></td><td>scikit‑learn / gradient boosting, feature store, model registry</td><td>🔮</td></tr>
</table>

---

## 📁 5 · Folder Structure

```
gaitguard/
├── apps/
│   ├── web/                         # ✅ Next.js 14 dashboard (TypeScript)
│   │   ├── src/
│   │   │   ├── app/                 # App Router routes
│   │   │   │   ├── page.tsx         # Dashboard (KPIs, fleet trend, distribution)
│   │   │   │   ├── patients/        # Directory + /[id] profile
│   │   │   │   ├── monitor/[sessionId]/  # Live Monitoring cockpit
│   │   │   │   ├── analytics/       # Longitudinal charts + export
│   │   │   │   ├── reports/         # Report list + /[id] printable report
│   │   │   │   ├── alerts/          # Triage queue + notification drawer
│   │   │   │   ├── settings/        # 11‑tab settings (profile…system health)
│   │   │   │   ├── layout.tsx       # Root layout + Providers
│   │   │   │   ├── providers.tsx    # Theme + Toast providers
│   │   │   │   ├── loading.tsx      # Global loading state
│   │   │   │   ├── error.tsx        # Global error boundary
│   │   │   │   └── not-found.tsx    # 404
│   │   │   ├── components/
│   │   │   │   ├── shell/           # Sidebar, Topbar, AppShell, NotificationBell
│   │   │   │   ├── cockpit/         # RiskGauge, FootHeatmap, Skeleton3D, CoP, …
│   │   │   │   ├── dashboard/       # KpiCard, AnalyticsCard, DeviceStatusCard
│   │   │   │   ├── charts/          # AreaTrend, MetricChart
│   │   │   │   ├── patient/         # PatientDetail
│   │   │   │   ├── report/          # ReportView (printable)
│   │   │   │   └── ui/              # Button, Panel, Segmented, Toast, Skeleton…
│   │   │   ├── hooks/               # useLiveSession, useApiData, useSampled…
│   │   │   └── lib/                 # api, liveClient, mockStream, store, types…
│   │   ├── Dockerfile               # ✅ Next standalone image
│   │   └── package.json
│   │
│   └── api/                         # ✅ FastAPI backend
│       ├── app/
│       │   ├── main.py              # App factory, router registration, lifespan
│       │   ├── core/               # config, database, security, deps, (pubsub)
│       │   ├── models/             # SQLAlchemy models (12 tables)
│       │   ├── schemas/            # Pydantic request/response models
│       │   ├── api/routes/         # auth, patients, sessions, alerts, trends,
│       │   │                       # dashboard, analytics, reports, devices,
│       │   │                       # notifications, settings
│       │   ├── ws/                 # hub, routes, session_runtime, demo_sim
│       │   └── services/           # seed
│       ├── scripts/simulate.py     # ESP32 + vision stream simulator
│       ├── Dockerfile              # ✅ Python image (repo‑root context)
│       └── requirements.txt
│
│   └── vision/                      # ✅ MediaPipe pose worker
│       ├── config.py               # landmark indices + thresholds
│       ├── pose_util.py            # joint angles, symmetry, circumduction
│       ├── gait_metrics.py         # GaitAnalyzer → PoseFrame metrics
│       ├── worker.py               # webcam → MediaPipe → WS ingest
│       └── requirements.txt
│
├── packages/
│   └── fusion/                      # ✅ Shared, pure‑Python risk engine
│       └── gaitguard_fusion/
│           ├── types.py            # InsoleSample, PoseSample, RiskAssessment…
│           ├── features.py         # feature extraction (0..1 normalized)
│           ├── engine.py           # FusionState + RiskEngine (weighted rules)
│       └── tests/test_engine.py    # smoke tests (healthy→Normal, PD→High)
│
├── infra/
│   ├── docker-compose.yml           # ✅ web + api + timescaledb + redis
│   └── schema.sql                   # 🔶 PostgreSQL DDL
├── docs/
│   └── ER.md                        # Entity‑relationship diagram
├── ARCHITECTURE.md                  # Full system design document
└── README.md                        # 👋 you are here
```

> [!NOTE]
> A `firmware/esp32/` directory and a `packages/contracts/` schema package are part of the roadmap and are **not** in the repository yet.

---

## 🚀 6 · Installation

### Prerequisites

| Tool | Version | Required for |
|------|---------|--------------|
| **Node.js** | ≥ 18 (20 recommended) | Frontend |
| **Python** | ≥ 3.9 | Backend + fusion engine |
| **Docker + Compose** | latest | One‑command full stack |
| **PostgreSQL + TimescaleDB** | 16 / 2.x | Production DB (optional — SQLite works for dev) |
| **Redis** | 7 | Multi‑worker realtime (optional) |
| **Git** | any | Cloning |

### Option A — 🐳 One command (Docker, recommended)

```bash
git clone https://github.com/<your-org>/gaitguard.git
cd gaitguard/infra
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web dashboard | http://localhost:3000 |
| API + Swagger docs | http://localhost:8000/docs |
| PostgreSQL + TimescaleDB | `localhost:5432` |
| Redis | `localhost:6379` |

The API seeds demo users, patients, devices, notifications, and alerts on first start.

### Option B — 💻 Local dev (zero infrastructure)

The backend defaults to **SQLite + in‑process pub/sub**, so no database or Redis is needed.

<details>
<summary><b>1 · Backend</b></summary>

```bash
cd apps/api
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # optional — defaults work as‑is
uvicorn app.main:app --reload # → http://localhost:8000/docs
```
</details>

<details>
<summary><b>2 · Frontend</b></summary>

```bash
cd apps/web
npm install
npm run dev                   # → http://localhost:3000
```
</details>

<details>
<summary><b>3 · Fusion engine tests (optional)</b></summary>

```bash
cd packages/fusion
python tests/test_engine.py   # "fusion engine: all smoke tests passed"
```
</details>

### See the whole pipeline live

With the API running, either **click "Live Monitoring"** in the dashboard (which auto‑starts a server‑side simulator), or run the standalone streamer:

```bash
cd apps/api && .venv\Scripts\activate
python scripts/simulate.py --patient pt-1042 --duration 120
```

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gaitguard.health` | `admin123` |
| Clinician | `clinician@gaitguard.health` | `clinician123` |
| Caregiver | `caregiver@gaitguard.health` | `caregiver123` |

> [!WARNING]
> These are **seed/demo** credentials for local use only. Never deploy them to a public environment. Rotate `JWT_SECRET` and all passwords before any real deployment.

### Production deployment

Switch the backend to Postgres/Timescale + Redis via two environment variables (see [§7](#-7--environment-variables)); no code changes required. See [§22 Deployment](#-22--deployment).

---

## 🔐 7 · Environment Variables

### Backend (`apps/api/.env`)

| Variable | Default | Status | Description |
|----------|---------|:------:|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./gaitguard.db` | ✅ | SQLAlchemy async URL. Postgres: `postgresql+asyncpg://user:pass@host:5432/db` |
| `REDIS_URL` | *(empty)* | ✅ | Redis URL for pub/sub fan‑out. Empty → in‑process (single worker) |
| `JWT_SECRET` | `change-me-in-production` | ✅ | HMAC signing key for JWTs — **must** be a long random value in prod |
| `JWT_ALGORITHM` | `HS256` | ✅ | JWT signing algorithm |
| `ACCESS_TOKEN_MINUTES` | `15` | ✅ | Access‑token lifetime |
| `REFRESH_TOKEN_DAYS` | `7` | ✅ | Refresh‑token lifetime |
| `INGEST_TOKEN` | `gaitguard-device-token` | ✅ | Shared secret for device (ESP32 / vision) WS ingest |
| `CORS_ORIGINS` | `http://localhost:3000` | ✅ | Comma‑separated allowed origins |
| `SEED_ON_STARTUP` | `1` | ✅ | Seed demo data on boot (`1`/`0`) |

### Frontend (`apps/web/.env.local`)

| Variable | Default | Status | Description |
|----------|---------|:------:|-------------|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:8000` | ✅ | API origin the browser calls |
| `NEXT_PUBLIC_USE_BACKEND` | `auto` | ✅ | `1` force backend · `0` force demo data · `auto` try backend then fall back |

### Planned AI variables 🔮

| Variable | Status | Description |
|----------|:------:|-------------|
| `OPENAI_API_KEY` | 🔮 | LLM provider key for the Doctor Assistant |
| `MODEL_NAME` | 🔮 | Chat/completion model id |
| `EMBEDDING_MODEL` | 🔮 | Embedding model for RAG |
| `CHROMA_DB_PATH` | 🔮 | On‑disk path for the ChromaDB vector store |

---

## ⚙️ 8 · Backend

The backend is a modular FastAPI application. `app/main.py` wires everything together with an async `lifespan` that (1) creates tables, (2) seeds demo data, and (3) starts the realtime hub.

### 8.1 Module map

| Module | Responsibility |
|--------|----------------|
| `core/config.py` | Pydantic‑settings config + a `sys.path` bootstrap that makes the shared `gaitguard_fusion` package importable |
| `core/database.py` | Async engine, session factory, `init_db()` (+ TimescaleDB hypertable creation on Postgres) |
| `core/security.py` | Password hashing (bcrypt) + JWT create/decode |
| `core/deps.py` | `get_current_user` and `require_role(...)` RBAC dependency |
| `models/` | 12 SQLAlchemy models (see [§14](#-14--database-design)) |
| `schemas/` | Pydantic v2 request/response contracts |
| `api/routes/` | REST routers: auth, patients, sessions, alerts, trends, dashboard, analytics, reports, devices, notifications, settings |
| `ws/hub.py` | Broadcast hub — Redis pub/sub or in‑process fan‑out |
| `ws/routes.py` | WebSocket endpoints (ingest + live channel) |
| `ws/session_runtime.py` | Per‑session `FusionState`, the 2 Hz fusion loop, alert/notification generation |
| `ws/demo_sim.py` | In‑process ESP32 + vision simulator |
| `services/seed.py` | Idempotent demo seed |

### 8.2 Authentication

- **OAuth2 password flow** (`POST /api/auth/login`, form‑encoded `username`+`password`).
- **JWT** access (15 min) + refresh (7 days) tokens, HS256, bcrypt‑hashed passwords.
- **RBAC** via a dependency factory: `Depends(require_role("admin", "clinician"))`.

### 8.3 Risk Engine (fusion loop)

Each active session owns a `SessionRuntime` with rolling insole/pose buffers. A background task runs at **2 Hz**: it extracts features over the trailing 2‑second window, scores them with the rule engine, persists a `risk_score`, and publishes the assessment to the hub. High‑risk crossings insert an `Alert` and a `Notification`. Full details in [§10](#-10--the-fusion-engine-risk-model).

### 8.4 Report generator 🔶

Reports are assembled from session risk history + gait metrics into a structured payload rendered client‑side as a printable hospital document (PDF/CSV/print). LLM‑authored narrative recommendations are **🔮 planned**; current recommendations are rule‑based.

### 8.5 RAG / Embedding / Retrieval / Prompt Builder 🔮

These modules are **designed but not implemented**. Their intended shape is documented in [§11](#-11--ai-pipeline--planned) and [§12](#-12--doctor-assistant-ai--planned).

---

## 🖥️ 9 · Frontend

A Next.js 14 App‑Router application with a design system inspired by Philips Healthcare, GE Healthcare, and Apple Health.

### 9.1 Pages

| Route | Description |
|-------|-------------|
| `/` | **Dashboard** — fleet KPIs, risk‑trend area chart, risk distribution, device status, weekly/monthly analytics, active sessions, recent alerts |
| `/patients` | **Directory** — search, risk filter, grid/list, trend sparklines |
| `/patients/[id]` | **Profile** — demographics, diagnosis, vitals, devices, tabs (Overview/Sessions/Pressure/Reports/History) |
| `/monitor/[sessionId]` | **Live Monitoring cockpit** — see [§10](#-10--the-fusion-engine-risk-model) |
| `/analytics` | **Analytics** — 7 metric charts, Day/Week/Month/Year, PNG + PDF export |
| `/reports` + `/reports/[id]` | **Reports** — list + printable hospital report |
| `/alerts` | **Triage** — typed alerts, priority, notification drawer, ack/resolve |
| `/settings` | **Settings** — Profile, Hospital, Appearance, Notifications, Devices, API Keys, Roles, Security, Logs, Database, System Health |

### 9.2 Design system & UX

- **Tailwind + CSS‑variable theme** — light‑first white/blue/teal, hand‑tuned dark mode via `next-themes`.
- **Framer Motion** — card entrances, hover lift, animated nav indicator (`layoutId`), page transitions, count‑up KPIs.
- **Glassmorphism** — reserved for chrome (sidebar, topbar, drawers).
- **Responsive** — sidebar collapses to an off‑canvas drawer on mobile.
- **State** — Zustand store for live sensor/risk data; high‑frequency frames stay off React's render path (imperative canvas + `rAF`).
- **Resilience** — every data page uses `useApiData()` which fetches from the API and **gracefully falls back to demo data** if the backend is offline.

### 9.3 Live data wiring

The **Live Cockpit** connects to `/ws/live/{session_id}` and routes tagged messages into the store. If the backend is unreachable, a built‑in browser **mock stream** takes over so the demo always runs — the cockpit is transport‑agnostic.

---

## 🔌 Realtime Streaming

```mermaid
sequenceDiagram
    participant Dev as ESP32 / Vision Worker
    participant WS as WS Ingest
    participant RT as SessionRuntime
    participant HUB as Hub (Redis/in‑proc)
    participant UI as Dashboard

    Dev->>WS: {t, fsr:{left,right}, imu:{…}}  (insole 50 Hz)
    Dev->>WS: {t, landmarks, metrics:{…}}     (pose 30 Hz)
    WS->>RT: add_insole() / add_pose()
    WS->>HUB: publish {type: insole|pose}
    RT->>HUB: publish {type: risk} (2 Hz)
    HUB-->>UI: fan‑out to all subscribers
```

- **Ingest:** `/ws/ingest/insole` and `/ws/ingest/vision` (device‑token auth).
- **Broadcast:** `/ws/live/{session_id}` (JWT optional in demo).
- **Envelope:** `{ "type": "conn"|"insole"|"pose"|"risk"|"alert", "payload": {...} }`.
- **Scale‑out:** with `REDIS_URL` set, the hub routes through Redis pub/sub so any Uvicorn worker can serve any client. Without it, an in‑process path handles single‑worker dev.

---

## 🧠 10 · The Fusion Engine (Risk Model)

> [!IMPORTANT]
> This is GaitGuard's **shipping** intelligence — a **transparent, weighted rule engine**, not a black‑box model or an LLM. Because the weights are explicit, every score is fully auditable, which is essential for clinical trust.

### 10.1 Pipeline

```
INGEST   insole → ring buffer A (400) ; pose → ring buffer B (200)
ALIGN    2 s sliding window, evict stale samples
FEATURES normalize six features to [0,1] (higher = more abnormal)
FUSE     score = Σ (feature × weight), clamp to [0,1]
CLASSIFY Normal < 0.33 ≤ Mild < 0.66 ≤ High
EXPLAIN  rank drivers by contribution; compute confidence
EMIT     publish + persist
```

### 10.2 Features & weights

| Feature | Weight | Source | Signal |
|---------|:------:|--------|--------|
| `load_asym` | 0.22 | Insole | L/R plantar‑load imbalance |
| `freeze` | 0.20 | Fusion | Freezing / festination (stalled cadence or collapsed load) |
| `sway` | 0.18 | Vision | Trunk sway + IMU instability (max of the two) |
| `arm_swing` | 0.16 | Vision | Reduced arm‑swing symmetry |
| `cadence` | 0.14 | Insole | Slowing below ~110 spm baseline |
| `double_support` | 0.10 | Fusion | Excess double‑support time |

Confidence peaks when the score is decisively low or high and dips in the ambiguous mid‑band:
`confidence = clamp(0.78 + 0.18 × (1 − |score − 0.5| × 2), 0, 1)`.

### 10.3 Example assessment payload

```json
{
  "t": 1722068400123.0,
  "level": "high",
  "score": 0.91,
  "confidence": 0.81,
  "drivers": [
    { "key": "freeze",         "label": "Freezing / festination",  "weight": 0.20, "source": "fusion" },
    { "key": "load_asym",      "label": "Plantar load asymmetry",  "weight": 0.184,"source": "insole" },
    { "key": "sway",           "label": "Trunk sway",              "weight": 0.18, "source": "vision" }
  ]
}
```

### 10.4 The Live Monitoring cockpit

The `/monitor/[sessionId]` view renders this engine's output in real time:

| Region | Panels |
|--------|--------|
| **Left** | Live Camera (MediaPipe overlay) · 3D Skeleton |
| **Center** | Plantar Pressure Heatmap · Foot Pressure Distribution · Center of Pressure |
| **Right** | Risk Gauge · Live Sensor Values (FSR1‑4, accel, gyro, risk) · Driver Breakdown |
| **Bottom** | Risk Timeline · Detected Events (heel strike, toe off, stride variability, fall detection) · Alerts feed |

---

## 🤖 11 · AI Pipeline · Planned

> [!NOTE]
> **🔮 Everything in §11–§13 is roadmap.** It is not in the codebase. It documents the intended architecture so contributors can build toward it.

```mermaid
flowchart LR
    R["Patient reports<br/>+ session data"] --> S["Summary generation<br/>(structured extraction)"]
    S --> E["Embedding<br/>(sentence‑transformers)"]
    E --> V[("ChromaDB<br/>vector store<br/>filtered by patient_id")]
    Q["Clinician question"] --> QE["Query embedding"]
    QE --> V
    V --> RET["Hybrid retrieval<br/>(semantic + metadata)"]
    RET --> P["Prompt builder<br/>context injection + guardrails"]
    P --> LLM["LLM"]
    LLM --> A["Answer + citations<br/>+ confidence"]
```

**Design principles:** patient‑scoped retrieval (never leak across patients), answers grounded **only** in retrieved records, mandatory citations, and a refuse‑when‑uncertain policy.

---

## 👨‍⚕️ 12 · Doctor Assistant AI · Planned

> [!NOTE]
> 🔮 **Not implemented.** Target design below.

| Aspect | Intended design |
|--------|-----------------|
| **Purpose** | Natural‑language Q&A over a single patient's records: *"How has this patient's fall risk trended this month?"* |
| **Architecture** | RAG over ChromaDB, patient‑filtered |
| **Prompt engineering** | System prompt enforces medical‑safety, grounding, and citation rules |
| **Context injection** | Top‑k retrieved snippets + structured metrics injected into the prompt |
| **Medical safety** | Refuses diagnosis/treatment beyond evidence; adds disclaimers |
| **Citations** | Every claim links to a source record id |
| **Confidence score** | Derived from retrieval similarity + answer coverage |
| **Conversation memory** | Per‑session, per‑patient short‑term memory |
| **Patient filtering** | Hard metadata filter on `patient_id` at retrieval time |
| **Hybrid search** | Semantic (vectors) + keyword/metadata filters |

<details>
<summary><b>Example conversation (illustrative, planned)</b></summary>

```
Clinician: Summarize Priya Nadar's fall‑risk trend this month.
Assistant : Over the last 30 days her mean fall‑risk index rose from 42% to 64%
            [session #s103, #s118]. Three freezing‑of‑gait episodes were logged
            in the last week [alert al‑8842]. Plantar‑load asymmetry averaged
            68/32 (left‑dominant) [report rep‑pt‑3390‑1].
            ⚠️ Decision support only — confirm clinically. Confidence: 0.82.
```
</details>

---

## 📈 13 · Machine Learning

**Today:** GaitGuard's classifier is the **rule engine** in [§10](#-10--the-fusion-engine-risk-model) — transparent, requires no training data, and is fully testable. This is a deliberate v1 choice for explainability and cold‑start.

**Planned ML upgrade 🔮:**

| Stage | Plan |
|-------|------|
| **Dataset** | Labeled walking sessions (insole + pose features) with fall/near‑fall outcomes |
| **Feature engineering** | The same 6 normalized features + FFT‑based freezing index, tremor power (4–6 Hz), spectral gait entropy |
| **Model selection** | Gradient‑boosted trees (baseline) → temporal models (1D‑CNN / LSTM) |
| **Inference** | Drop‑in behind the existing `RiskEngine` interface |
| **Explainability** | Expose `feature_importances_` / SHAP as the "drivers" list |
| **Evaluation** | ROC‑AUC, precision/recall at clinical thresholds, calibration curves |
| **Limitations** | Requires labeled data; risk of dataset bias; needs prospective validation |

---

## 🗄️ 14 · Database Design

### 14.1 Entity‑relationship diagram

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "clinician runs"
    PATIENTS ||--o{ SESSIONS : "has"
    PATIENTS ||--o{ ALERTS : "raises"
    PATIENTS ||--o{ DEVICES : "wears"
    PATIENTS ||--o{ RISK_PREDICTIONS : "forecast"
    SESSIONS ||--o{ RISK_SCORES : "produces"
    SESSIONS ||--o{ SENSOR_SAMPLES : "records"
    SESSIONS ||--o{ REPORTS : "summarized by"
    SESSIONS ||--o{ ALERTS : "triggers"
    DOCTORS ||--o{ PATIENTS : "assigned"

    USERS {
        string id PK
        string email
        string role
        string hashed_password
    }
    PATIENTS {
        string id PK
        string mrn
        string name
        int age
        string baseline_risk
    }
    DOCTORS {
        string id PK
        string name
        string specialty
    }
    DEVICES {
        string id PK
        string serial
        string type
        string status
        int battery
    }
    SESSIONS {
        string id PK
        string patient_id FK
        string status
        string peak_level
    }
    RISK_SCORES {
        string session_id PK
        datetime time PK
        float score
        string level
        json drivers
    }
    SENSOR_SAMPLES {
        string session_id PK
        datetime time PK
        json fsr
        json imu
    }
    ALERTS {
        string id PK
        string patient_id FK
        string type
        string priority
        string status
    }
    REPORTS {
        string id PK
        string session_id FK
        string url
    }
    NOTIFICATIONS {
        string id PK
        string channel
        string title
        bool read
    }
    RISK_PREDICTIONS {
        string id PK
        string patient_id FK
        float predicted_score
    }
    SETTINGS {
        string key PK
        json value
    }
```

### 14.2 Tables

| Table | Purpose | Notes |
|-------|---------|-------|
| `users` | Auth identities + role | RBAC: admin/clinician/caregiver/patient |
| `patients` | Patient demographics + baseline risk | MRN‑indexed |
| `doctors` | Care‑team members | |
| `devices` | Paired insole/camera hardware | status + battery |
| `sessions` | A monitoring run | tracks `peak_level` |
| `risk_scores` | 2 Hz fused assessments | **TimescaleDB hypertable** on Postgres |
| `sensor_samples` | Raw insole samples | **hypertable**; off by default in demo |
| `alerts` | Typed, prioritized alerts | fall/high_risk/abnormal_pressure/sensor_failure/low_battery |
| `notifications` | In‑app/email/SMS feed | |
| `reports` | Generated session reports | |
| `risk_predictions` | Forward‑looking forecasts | 🔶 model output |
| `settings` | Key/value app settings | |

> [!NOTE]
> On PostgreSQL, `init_db()` creates the `timescaledb` extension and promotes `risk_scores` and `sensor_samples` to hypertables (best‑effort, safely skipped on SQLite). A dedicated `embeddings` table lives in the **🔮 planned** RAG layer. Full DDL: `infra/schema.sql`.

---

## 📡 15 · API Documentation

> Interactive Swagger UI is always available at **`http://localhost:8000/docs`** (ReDoc at `/redoc`). All non‑auth endpoints require `Authorization: Bearer <access_token>`.

### 15.1 Endpoint overview

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/api/auth/login` | – | OAuth2 login → access + refresh |
| `POST` | `/api/auth/refresh` | – | Rotate tokens |
| `GET` | `/api/auth/me` | ✅ | Current user |
| `GET` | `/api/patients` | ✅ | List/search patients |
| `POST` | `/api/patients` | admin/clinician | Create patient |
| `GET` | `/api/patients/{id}` | ✅ | Patient detail |
| `POST` | `/api/patients/{id}/sessions` | ✅ | Start a monitoring session |
| `GET` | `/api/patients/{id}/sessions` | ✅ | Session history |
| `GET` | `/api/sessions/{id}` | ✅ | Session detail |
| `PATCH` | `/api/sessions/{id}` | ✅ | Stop a session |
| `POST` | `/api/sessions/{id}/simulate` | ✅ | Start in‑process demo simulator |
| `DELETE` | `/api/sessions/{id}/simulate` | ✅ | Stop simulator |
| `GET` | `/api/sessions/{id}/timeseries` | ✅ | Risk‑score time series |
| `GET` | `/api/patients/{id}/trends` | ✅ | Longitudinal risk points |
| `GET` | `/api/alerts` | ✅ | Alert queue (typed, prioritized) |
| `PATCH` | `/api/alerts/{id}` | ✅ | Acknowledge / resolve |
| `GET` | `/api/dashboard/summary` | ✅ | Fleet KPIs + distribution + devices |
| `GET` | `/api/analytics/overview` | ✅ | Metric series by range |
| `GET` | `/api/notifications` | ✅ | Notification feed |
| `GET` | `/api/reports`, `/api/reports/{id}` | ✅ | Reports 🔶 |
| `GET` | `/api/devices` | ✅ | Device fleet 🔶 |
| `GET`/`PUT` | `/api/settings` | ✅ | App settings 🔶 |
| `WS` | `/ws/ingest/insole`, `/ws/ingest/vision` | device token | Device ingest |
| `WS` | `/ws/live/{session_id}` | ✅ (opt) | Dashboard live channel |

### 15.2 Examples

<details>
<summary><b>POST /api/auth/login</b></summary>

**Request** (form‑encoded)
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=clinician@gaitguard.health&password=clinician123"
```
**Response `200`**
```json
{ "access_token": "eyJhbGci…", "refresh_token": "eyJhbGci…", "token_type": "bearer" }
```
**Errors:** `401 Incorrect email or password`
</details>

<details>
<summary><b>GET /api/dashboard/summary</b></summary>

```bash
curl http://localhost:8000/api/dashboard/summary -H "Authorization: Bearer $TOKEN"
```
```json
{
  "total_patients": 4,
  "active_patients": 1,
  "high_risk_patients": 1,
  "open_alerts": 3,
  "devices": { "online": 5, "total": 6 },
  "distribution": { "normal": 1, "mild": 2, "high": 1 }
}
```
</details>

<details>
<summary><b>GET /api/alerts</b></summary>

```json
[
  {
    "id": "88ca0818…", "type": "fall", "priority": "critical", "level": "high",
    "patient_id": "pt-3390", "patient_name": "Priya Nadar",
    "title": "Fall-pattern detected · Priya Nadar",
    "detail": "Sudden load loss + high sway · freezing episode",
    "status": "open", "created_at": "2026-07-27T09:14:02"
  }
]
```
</details>

<details>
<summary><b>POST /chat — Doctor Assistant 🔮 (planned)</b></summary>

> Not implemented. Target contract:
```json
// Request
{ "patient_id": "pt-3390", "message": "Summarize this month's risk trend." }
// Response
{ "answer": "…", "citations": ["session:s118", "alert:al-8842"], "confidence": 0.82 }
```
</details>

### 15.3 Status codes

| Code | Meaning |
|------|---------|
| `200 / 201 / 202` | Success |
| `401` | Missing/invalid token |
| `403` | Authenticated but role‑forbidden |
| `404` | Resource not found |
| `422` | Validation error (Pydantic) |

---

## 🛡️ 16 · Security

| Control | Status | Implementation |
|---------|:------:|----------------|
| **JWT auth** | ✅ | Access + refresh, HS256, expiry, refresh rotation |
| **Password hashing** | ✅ | bcrypt via passlib |
| **Role‑Based Access Control** | ✅ | `require_role(...)` dependency |
| **Input validation** | ✅ | Pydantic v2 on every request body/query |
| **SQL‑injection prevention** | ✅ | SQLAlchemy parameterized queries / ORM |
| **Device auth** | ✅ | Separate ingest token for WS device streams |
| **CORS** | ✅ | Explicit allow‑list via `CORS_ORIGINS` |
| **HTTPS/TLS** | 🔶 | Terminate at the proxy/load balancer in prod |
| **Audit logs** | 🔶 | Designed; partial coverage |
| **Prompt‑injection protection** | 🔮 | Part of the planned RAG guardrails |
| **RAG isolation (patient‑scoped)** | 🔮 | Hard metadata filter at retrieval |
| **Medical data protection (HIPAA/GDPR)** | 🔮 | Encryption at rest, DPA, retention policy — roadmap |

> [!WARNING]
> GaitGuard is a prototype and is **not** HIPAA/GDPR certified. Do not store real patient data without implementing the roadmap security controls and a compliance review.

---

## 🔍 17 · Explainable AI

Explainability is a **first‑class product feature**, not an afterthought. Every risk score is accompanied by its ranked drivers and their source stream (insole vs. vision vs. fusion), so a clinician can see *why*:

> **HIGH · 91%** — primary drivers: **Freezing/festination** (fusion), **Plantar‑load asymmetry** (insole), **Trunk sway** (vision). Confidence 81%.

The dashboard renders this as a **Driver Breakdown** panel (horizontal bars colored by source) and a per‑session **risk timeline** with the three bands shaded. Because the model is rule‑based, the mapping from inputs to output is deterministic and auditable — the opposite of a black box.

---

## 🖼️ 18 · Screenshots

> [!NOTE]
> Add real screenshots to `docs/assets/` and update the links below.

| View | Placeholder |
|------|-------------|
| Dashboard | `docs/assets/dashboard.png` |
| Live Monitoring cockpit | `docs/assets/cockpit.png` |
| Patient details | `docs/assets/patient.png` |
| Analytics | `docs/assets/analytics.png` |
| Risk graphs | `docs/assets/risk.png` |
| Printable report | `docs/assets/report.png` |

---

## ⚡ 19 · Performance

| Concern | Approach |
|---------|----------|
| **Ingest rate** | 50 Hz insole + 30 Hz pose per session over WebSockets |
| **Fusion latency** | ~12 ms per assessment; emitted at 2 Hz |
| **Frontend render** | High‑frequency frames bypass React — imperative Canvas + `requestAnimationFrame`; charts throttled ~12 Hz; readouts ~2 Hz |
| **Fan‑out** | Redis pub/sub allows N stateless Uvicorn workers to serve any client |
| **Time‑series queries** | TimescaleDB hypertables + (roadmap) continuous aggregates for instant multi‑month trends |
| **Caching** | Redis for pub/sub + cache; frontend fallback avoids hard failures |
| **Embedding/search speed** 🔮 | Target < 100 ms retrieval via ChromaDB HNSW |
| **LLM response** 🔮 | Streamed tokens to keep perceived latency low |

---

## 🐳 20 · Docker

```mermaid
flowchart TD
    subgraph compose["docker compose (infra/docker-compose.yml)"]
        WEB["web · Next.js standalone<br/>:3000"]
        API["api · FastAPI/Uvicorn<br/>:8000"]
        DB[("db · timescale/timescaledb<br/>:5432")]
        RED[("redis · redis:7‑alpine<br/>:6379")]
    end
    WEB -->|REST + WS| API
    API --> DB
    API <--> RED
```

- **`apps/web/Dockerfile`** — multi‑stage build producing a Next.js **standalone** server image.
- **`apps/api/Dockerfile`** — Python image built from the **repo root** so the shared `packages/fusion` package is included; the monorepo layout is preserved so the `sys.path` bootstrap resolves.
- **`infra/docker-compose.yml`** — `web` + `api` + `timescaledb` + `redis`, with healthchecks and a persistent DB volume.

```bash
cd infra && docker compose up --build     # full stack, one command
docker compose config -q                  # validate the compose file
```

---

## 🧪 21 · Testing

| Type | Status | How |
|------|:------:|-----|
| **Fusion unit/smoke tests** | ✅ | `python packages/fusion/tests/test_engine.py` (healthy→Normal, Parkinsonian→High, drivers ranked) |
| **Type checking** | ✅ | `cd apps/web && npx tsc --noEmit` |
| **Integration (WS pipeline)** | ✅ | `apps/api/scripts/simulate.py` streams a full session end‑to‑end |
| **API tests (pytest + httpx)** | 🔮 | Planned formal suite |
| **E2E (Playwright)** | 🔮 | Planned |
| **Performance / load** | 🔮 | Planned (Locust/k6) |
| **Security tests** | 🔮 | Planned (dependency + auth fuzzing) |

---

## ☁️ 22 · Deployment

The stack is container‑native and cloud‑agnostic. General pattern: **web → static/host platform**, **api + workers → containers**, **db → managed Postgres/Timescale**, **redis → managed cache**.

| Target | Notes |
|--------|-------|
| **Docker / VPS** | `docker compose up -d` behind Nginx/Caddy for TLS |
| **AWS** | ECS/Fargate (api) · RDS or Timescale Cloud (db) · ElastiCache (redis) · Amplify/S3+CloudFront or Vercel (web) |
| **Azure** | Container Apps (api) · Azure DB for PostgreSQL · Azure Cache for Redis · Static Web Apps (web) |
| **Google Cloud** | Cloud Run (api) · Cloud SQL (db) · Memorystore (redis) · Firebase Hosting (web) |
| **Railway / Render** | One service per Dockerfile; managed Postgres + Redis add‑ons |
| **Vercel** | Frontend (`apps/web`); point `NEXT_PUBLIC_API_BASE` at the API host |

**Production switches (no code change):**
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/gaitguard
REDIS_URL=redis://redis-host:6379/0
JWT_SECRET=<long-random-secret>
CORS_ORIGINS=https://app.yourdomain.com
```

---

## 🗺️ 23 · Future Roadmap

```mermaid
timeline
    title GaitGuard Roadmap
    section v0.x (done)
      Rule‑based fusion engine : Live cockpit : REST + WS backend : Docker stack
    section v1.0
      Alembic migrations : Real ESP32 firmware : WebRTC camera feed : Formal test suite
    section v1.5
      Trained ML risk model : Continuous aggregates : Audit log completion : HIPAA controls
    section v2.0
      Doctor Assistant (RAG) : ChromaDB vector store : LLM recommendations : Mobile app
```

- [ ] Alembic migrations + production Postgres/Timescale hardening
- [ ] ESP32 firmware (`firmware/esp32/`) + real device provisioning
- [ ] WebRTC live video with pose overlay
- [ ] Trained gradient‑boosted risk model behind the `RiskEngine` interface
- [ ] Doctor Assistant AI (RAG over ChromaDB), patient‑scoped
- [ ] LLM‑authored report narratives & recommendations
- [ ] Compliance: encryption at rest, audit trail, retention policy
- [ ] Mobile companion app for caregivers

---

## 🤝 24 · Contributing

Contributions are welcome! 🎉

1. **Fork** the repo and create a branch: `git checkout -b feat/my-feature`
2. **Follow the code style** — match surrounding code; TypeScript strict on the frontend, typed Python on the backend.
3. **Keep it modular** — new panels/pages should reuse the `components/ui` and `charts` primitives.
4. **Verify before pushing:** `npx tsc --noEmit` (web) and `python tests/test_engine.py` (fusion).
5. **Write clear commits** and open a **Pull Request** describing the change and its status tag (✅/🔶/🔮).

Please open an issue first for large features so we can align on design. Be respectful and collaborative — a `CODE_OF_CONDUCT.md` is on the roadmap.

---

## 📄 License

Released under the **MIT License**.

```
MIT License

Copyright (c) 2026 GaitGuard contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

> [!NOTE]
> Add a `LICENSE` file at the repo root to make the MIT license machine‑detectable by GitHub.

---

## 👥 25 · Authors

| Role | Contributor |
|------|-------------|
| Project lead / full‑stack | *Your name here* (`@your-handle`) |
| Firmware / hardware | *TBD* |
| ML / AI | *TBD* |

> Replace with your team. GitHub will render avatars if you use `@handles`.

---

## 🙏 26 · Acknowledgements

- **Clinical inspiration** — the gait‑analysis and Parkinson's research community.
- **Open source** — FastAPI, Next.js, SQLAlchemy, Recharts, Three.js / react‑three‑fiber, Framer Motion, TimescaleDB, Redis, and MediaPipe.
- **Design language** — inspired by Philips Healthcare, GE Healthcare, Siemens Healthineers, and Apple Health.
- Everyone building **affordable, explainable healthcare technology**.

---

## ❓ 27 · FAQ

<details>
<summary><b>1. Does GaitGuard use an LLM or ChatGPT today?</b></summary>
No. The shipping risk model is a transparent rule‑based fusion engine. LLM/RAG features are roadmap (🔮).
</details>

<details>
<summary><b>2. Do I need a GPU?</b></summary>
No. The rule engine is pure Python and runs on a CPU. MediaPipe pose runs on the client/worker.
</details>

<details>
<summary><b>3. Do I need Postgres and Redis to try it?</b></summary>
No. The backend defaults to SQLite + in‑process pub/sub. Postgres/Timescale + Redis are opt‑in via env vars.
</details>

<details>
<summary><b>4. Can I run it without any hardware?</b></summary>
Yes. A built‑in server‑side simulator (and a browser mock stream) generate realistic gait so the whole system runs with zero hardware.
</details>

<details>
<summary><b>5. What sensors does the insole use?</b></summary>
An ESP32 with 4 force‑sensitive resistors (FSR) per foot and a 6‑axis IMU, streaming JSON at ~50 Hz.
</details>

<details>
<summary><b>6. How is the camera used?</b></summary>
A webcam + MediaPipe Pose extracts skeleton landmarks and gait metrics (cadence, symmetry, arm swing, trunk sway) at ~30 Hz.
</details>

<details>
<summary><b>7. What are the three risk levels?</b></summary>
Normal (&lt; 0.33), Mild (0.33–0.66), and High (≥ 0.66) on the fused 0–1 score.
</details>

<details>
<summary><b>8. Why a rule engine instead of ML?</b></summary>
Explainability and cold‑start: no labeled data needed, every score is auditable. A trained model is planned to augment it behind the same interface.
</details>

<details>
<summary><b>9. Is this a certified medical device?</b></summary>
No. It is a research/decision‑support prototype and must not be used for autonomous clinical decisions.
</details>

<details>
<summary><b>10. How does multi‑worker scaling work?</b></summary>
Set <code>REDIS_URL</code> and the broadcast hub routes through Redis pub/sub, so any Uvicorn worker can serve any client.
</details>

<details>
<summary><b>11. What happens if the backend is down?</b></summary>
The frontend detects it and falls back to demo data / an in‑browser simulation, so the UI never hard‑fails.
</details>

<details>
<summary><b>12. Where is the API documentation?</b></summary>
Auto‑generated Swagger at <code>/docs</code> and ReDoc at <code>/redoc</code>.
</details>

<details>
<summary><b>13. How do I add a new patient?</b></summary>
<code>POST /api/patients</code> (admin/clinician role) or via the Patients page (UI action is illustrative in the demo build).
</details>

<details>
<summary><b>14. Can I export reports?</b></summary>
Yes — the report page supports Print, Save‑as‑PDF (print dialog), and CSV export. Charts export to PNG on the Analytics page.
</details>

<details>
<summary><b>15. Which roles exist?</b></summary>
Admin, Clinician, Caregiver, Patient — enforced by <code>require_role</code>.
</details>

<details>
<summary><b>16. How is patient data isolated in the (planned) RAG?</b></summary>
Retrieval applies a hard <code>patient_id</code> metadata filter so context never crosses patients.
</details>

<details>
<summary><b>17. What DB tables store time‑series?</b></summary>
<code>risk_scores</code> and <code>sensor_samples</code> — TimescaleDB hypertables on Postgres.
</details>

<details>
<summary><b>18. Does it support dark mode?</b></summary>
Yes — a hand‑tuned dark theme via <code>next-themes</code>, toggleable in the top bar and Settings → Appearance.
</details>

<details>
<summary><b>19. What Python version is required?</b></summary>
3.9+ (the project targets 3.9 and runs on 3.11 in Docker).
</details>

<details>
<summary><b>20. How do alerts get generated?</b></summary>
The fusion loop raises a typed, prioritized alert (with a matching notification) when a session crosses into the High band; freezing escalates to a <code>fall</code>‑type alert.
</details>

<details>
<summary><b>21. Can I change the risk thresholds/weights?</b></summary>
Yes — edit <code>packages/fusion/gaitguard_fusion/engine.py</code> (<code>WEIGHTS</code>, thresholds). Both frontend and backend share this logic.
</details>

<details>
<summary><b>22. Is there an audit log?</b></summary>
Partial. Sensitive‑action logging is designed; full coverage is roadmap.
</details>

<details>
<summary><b>23. How do I point the frontend at a remote API?</b></summary>
Set <code>NEXT_PUBLIC_API_BASE</code> to the API URL and rebuild.
</details>

<details>
<summary><b>24. Does the WebSocket require auth?</b></summary>
Ingest requires a device token; the dashboard channel accepts a JWT (optional in the demo build).
</details>

<details>
<summary><b>25. What is the demo simulator?</b></summary>
An in‑process feeder (<code>ws/demo_sim.py</code>) that generates biomechanically plausible gait drifting Normal→Mild→High with freezing episodes.
</details>

<details>
<summary><b>26. How big is the sensor window?</b></summary>
2 seconds, evaluated at 2 Hz (every 0.5 s).
</details>

<details>
<summary><b>27. Can I contribute the ESP32 firmware?</b></summary>
Absolutely — <code>firmware/esp32/</code> is an open roadmap item; open an issue to coordinate.
</details>

<details>
<summary><b>28. Is there a mobile app?</b></summary>
Not yet; a caregiver companion app is on the v2 roadmap. The web app is fully responsive.
</details>

---

## 🛠️ 28 · Troubleshooting

<details>
<summary><b>Installation — <code>pip install</code> fails building wheels</b></summary>
Ensure a C toolchain is present (macOS: Xcode CLT; Debian: <code>build-essential</code>). The pinned versions target Python 3.9–3.11.
</details>

<details>
<summary><b>API — <code>ModuleNotFoundError: gaitguard_fusion</code></b></summary>
Run Uvicorn from <code>apps/api</code> so <code>core/config.py</code> can add <code>packages/fusion</code> to <code>sys.path</code> (it resolves the repo root via <code>parents[4]</code>).
</details>

<details>
<summary><b>API — port 8000 already in use</b></summary>
<code>uvicorn app.main:app --port 8001</code> and update <code>NEXT_PUBLIC_API_BASE</code>.
</details>

<details>
<summary><b>Database — Timescale extension error on SQLite</b></summary>
Expected and safely ignored; hypertables only apply on PostgreSQL.
</details>

<details>
<summary><b>Database — connection refused (Postgres)</b></summary>
Verify <code>DATABASE_URL</code>, that the DB is healthy (<code>pg_isready</code>), and that the <code>asyncpg</code> driver prefix is used: <code>postgresql+asyncpg://…</code>.
</details>

<details>
<summary><b>Docker — build context too large / slow</b></summary>
The root <code>.dockerignore</code> excludes <code>node_modules</code>, <code>.venv</code>, <code>.next</code>. Ensure it is present.
</details>

<details>
<summary><b>Frontend — CORS error calling the API</b></summary>
Add your origin to <code>CORS_ORIGINS</code> on the backend and restart.
</details>

<details>
<summary><b>Frontend — cockpit shows "local simulation (API offline)"</b></summary>
The browser couldn't reach the API. Confirm the backend is running and <code>NEXT_PUBLIC_API_BASE</code> is correct; the UI intentionally falls back so it never breaks.
</details>

<details>
<summary><b>Auth — 401 on every request</b></summary>
Your access token expired (15 min). Re‑login or use the refresh endpoint; the frontend client auto‑re‑authenticates once on 401.
</details>

<details>
<summary><b>WebSocket — no live data</b></summary>
Start a session and the simulator (<code>POST /api/sessions/{id}/simulate</code>) or click Live Monitoring; confirm the WS URL/port and that a dashboard client is subscribed (the simulator auto‑stops when nobody is watching).
</details>

<details>
<summary><b>Embedding / LLM — errors</b></summary>
These features are 🔮 planned and not in the codebase; if you're building them, set the planned env vars and wire the RAG modules per §11–§12.
</details>

---

## 🏁 29 · Conclusion

GaitGuard demonstrates that **explainable, real‑time fall‑risk monitoring** doesn't require a black box or expensive hardware. By fusing an inexpensive instrumented insole with computer‑vision pose tracking through a transparent rule engine, it delivers a clinically meaningful `Normal · Mild · High` signal — always accompanied by *why* — and wraps it in a polished, hospital‑grade dashboard with live monitoring, analytics, reporting, and alerting.

The foundation is production‑shaped: a modular FastAPI backend, a typed Next.js frontend, WebSocket streaming with Redis fan‑out, TimescaleDB time‑series storage, and a one‑command Docker stack. The roadmap — a trained ML model and a patient‑scoped RAG Doctor Assistant — builds naturally on top of these seams, behind interfaces that already exist.

We built this to be **honest, auditable, and useful**. Contributions, clinical feedback, and hardware collaborators are all welcome.

<div align="center">

**⭐ If GaitGuard is useful to you, please star the repo. ⭐**

*Built with care for safer mobility.* 🦶

</div>
