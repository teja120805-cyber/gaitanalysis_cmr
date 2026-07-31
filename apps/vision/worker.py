"""
GaitGuard Vision Worker
=======================

Real MediaPipe pose processing that streams live gait to the GaitGuard backend.

Pipeline:  webcam → OpenCV → MediaPipe Pose → 33 landmarks + gait metrics
           → WebSocket → /ws/ingest/vision → server fusion engine → dashboard

Usage:
    python worker.py --patient pt-1042 --display
    python worker.py --session <existing-session-id> --host localhost:8000

The worker logs in (demo clinician), creates a monitoring session for the patient
(unless --session is given), then streams pose frames. Open the printed URL in the
dashboard to watch the live 3D skeleton, camera overlay, and fused risk.
"""

from __future__ import annotations

import argparse
import json
import sys
import time

try:
    import cv2
    import mediapipe as mp
except ImportError:
    print("Missing deps. Run:  pip install -r requirements.txt", file=sys.stderr)
    raise

import httpx
from websockets.sync.client import connect

from gait_metrics import GaitAnalyzer
from pose_util import (
    calculate_circumduction_risk,
    get_all_features,
    get_all_joint_angles,
)


def _split_host(host: str):
    """Accept 'localhost:8000' or 'http(s)://host' → (http_base, ws_base)."""
    secure = host.startswith("https")
    host = host.replace("https://", "").replace("http://", "").rstrip("/")
    return (f"{'https' if secure else 'http'}://{host}", f"{'wss' if secure else 'ws'}://{host}")


def resolve_session(http_base: str, args) -> str:
    if args.session:
        return args.session
    with httpx.Client(base_url=http_base, timeout=10.0) as c:
        r = c.post("/api/auth/login", data={"username": args.email, "password": args.password})
        r.raise_for_status()
        token = r.json()["access_token"]
        r = c.post(f"/api/patients/{args.patient}/sessions", headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return r.json()["id"]


def landmarks_to_list(landmarks):
    return [[round(lm.x, 4), round(lm.y, 4), round(lm.z, 4)] for lm in landmarks]


def main() -> None:
    ap = argparse.ArgumentParser(description="GaitGuard MediaPipe vision worker")
    ap.add_argument("--host", default="localhost:8000")
    ap.add_argument("--patient", default="pt-1042")
    ap.add_argument("--session", default=None, help="Feed an existing session id")
    ap.add_argument("--token", default="gaitguard-device-token", help="Device ingest token")
    ap.add_argument("--email", default="clinician@gaitguard.health")
    ap.add_argument("--password", default="clinician123")
    ap.add_argument("--camera", type=int, default=0)
    ap.add_argument("--fps", type=float, default=20.0, help="Target send rate")
    ap.add_argument("--display", action="store_true", help="Show the annotated camera window")
    args = ap.parse_args()

    http_base, ws_base = _split_host(args.host)

    print("→ Resolving session…")
    session_id = resolve_session(http_base, args)
    ws_url = f"{ws_base}/ws/ingest/vision?session={session_id}&token={args.token}"
    print(f"✓ Session: {session_id}")
    print(f"✓ Ingest : {ws_url}")
    print(f"👉 Watch it: {http_base.replace('8000', '3000')}/monitor/{args.patient}?session={session_id}")

    mp_pose = mp.solutions.pose
    mp_draw = mp.solutions.drawing_utils
    pose = mp_pose.Pose(
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print("✗ Camera could not be opened.", file=sys.stderr)
        sys.exit(1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    analyzer = GaitAnalyzer()
    send_interval = 1.0 / max(1.0, args.fps)
    last_send = 0.0
    frames = 0

    print("▶ Streaming… (press Q in the window to stop, or Ctrl+C)")
    try:
        with connect(ws_url, max_size=None) as ws:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frame = cv2.resize(frame, (640, 480))
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                rgb.flags.writeable = False
                results = pose.process(rgb)

                now = time.time()
                risk_txt = "No person"
                if results.pose_landmarks:
                    lms = results.pose_landmarks.landmark
                    metrics = analyzer.feed(lms, now)
                    landmarks = landmarks_to_list(lms)
                    if args.display:
                        angles = get_all_joint_angles(lms)
                        feats = get_all_features(lms, angles)
                        risk_txt, _ = calculate_circumduction_risk(feats, angles)
                        mp_draw.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                else:
                    metrics = GaitAnalyzer.idle_metrics()
                    landmarks = []

                # Throttled send to the backend ingest.
                if now - last_send >= send_interval:
                    last_send = now
                    try:
                        ws.send(json.dumps({"t": now * 1000.0, "landmarks": landmarks, "metrics": metrics}))
                        frames += 1
                    except Exception as e:  # connection dropped
                        print(f"✗ WS send failed: {e}", file=sys.stderr)
                        break

                if args.display:
                    cv2.putText(frame, "GAITGUARD · VISION", (14, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (56, 189, 248), 2)
                    cv2.putText(frame, f"cadence {metrics['cadence']:.0f} spm  sym {metrics['stepLengthSym']*100:.0f}%",
                                (14, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
                    cv2.putText(frame, f"arm {metrics['armSwingSym']*100:.0f}%  sway {metrics['trunkSway']:.1f}deg  circ:{risk_txt}",
                                (14, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1)
                    cv2.imshow("GaitGuard Vision", frame)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break
    except KeyboardInterrupt:
        print("\n■ Stopped.")
    finally:
        cap.release()
        if args.display:
            cv2.destroyAllWindows()
        pose.close()
        print(f"Sent {frames} pose frames.")


if __name__ == "__main__":
    main()
