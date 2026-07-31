# GaitGuard — Vision Worker (MediaPipe)

Real computer‑vision pose processing for GaitGuard. Captures a webcam, runs
**MediaPipe Pose**, extracts gait metrics, and **streams live pose to the backend**
over WebSockets — driving the dashboard's 3D skeleton, camera overlay, and fused
fall‑risk in real time.

```
webcam → OpenCV → MediaPipe Pose → 33 landmarks + gait metrics
       → WebSocket → /ws/ingest/vision → server fusion → dashboard
```

> Kinematic pose math (joint angles, pelvic tilt, hip symmetry, step width, foot
> arc/clearance, circumduction risk) is adapted from the prototype by
> **[@kratikach99-tab/Smart_gait_analysis](https://github.com/kratikach99-tab/Smart_gait_analysis)**
> and extended here to produce GaitGuard's PoseFrame metric contract.

## What it computes

| Module | Output |
|--------|--------|
| `pose_util.py` | Joint angles, pelvic tilt, hip symmetry, step width, foot arc, lateral deviation, foot clearance, circumduction risk (overlay) |
| `gait_metrics.py` | **GaitGuard contract**: `cadence`, `stepLengthSym`, `armSwingSym`, `trunkSway`, `doubleSupport` (heel‑strike detection + rolling‑window analysis, EMA‑smoothed) |
| `worker.py` | Capture loop, session handling, WebSocket streaming, optional annotated display |

## Setup

```bash
cd apps/vision
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on *nix)
pip install -r requirements.txt
```

## Run

**1.** Start the backend (`apps/api`) and frontend (`apps/web`).

**2.** Start the vision worker (with a preview window):

```bash
python worker.py --patient pt-1042 --display
```

It logs in, creates a session, and prints a URL like:

```
👉 Watch it: http://localhost:3000/monitor/pt-1042?session=<session-id>
```

**3.** Open that URL in the dashboard — the cockpit **joins** that session and shows
your real webcam pose driving the 3D skeleton, camera overlay, sensor panels, and
the live fused risk score.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `localhost:8000` | Backend host (accepts `http(s)://…` too) |
| `--patient` | `pt-1042` | Patient to create a session for |
| `--session` | – | Feed an **existing** session id instead of creating one |
| `--token` | `gaitguard-device-token` | Device ingest token (`INGEST_TOKEN`) |
| `--camera` | `0` | OpenCV camera index |
| `--fps` | `20` | Target send rate to the backend |
| `--display` | off | Show the annotated OpenCV window |

## Notes

- **No insole required.** With only the vision stream, the server still fuses a
  risk score from vision‑derived features (trunk sway, arm swing, cadence,
  double‑support). Pair it with the ESP32 insole stream for the full model.
- `doubleSupport` is estimated from cadence — true ground‑contact timing needs the
  insole FSRs, which the fusion engine already consumes when present.
- MediaPipe landmark coordinates are normalized `[0,1]` (x,y) with relative depth
  (z), matching `apps/web/src/lib/types.ts` `PoseFrame`.
