"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Circle,
  Radio,
  RefreshCw,
  Repeat,
  Ruler,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { useLiveStore } from "@/lib/store";
import { BrowserGaitAnalyzer, type LM } from "@/lib/browserGait";
import { INGEST_TOKEN, WS_BASE } from "@/lib/config";
import { cn } from "@/lib/utils";

// MediaPipe WASM + model (loaded from CDN at runtime).
const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31],
  [24, 26], [26, 28], [28, 30], [30, 32],
];
const DOTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// Gait joint angles: vertex index + the (a, vertex, c) triple + label + color.
const ANGLE_JOINTS: { i: number; tri: [number, number, number]; k: string; c: string }[] = [
  { i: 25, tri: [23, 25, 27], k: "L knee", c: "#22d3ee" },
  { i: 26, tri: [24, 26, 28], k: "R knee", c: "#22d3ee" },
  { i: 23, tri: [11, 23, 25], k: "L hip", c: "#60a5fa" },
  { i: 24, tri: [12, 24, 26], k: "R hip", c: "#60a5fa" },
  { i: 27, tri: [25, 27, 31], k: "L ankle", c: "#5eead4" },
  { i: 28, tri: [26, 28, 32], k: "R ankle", c: "#5eead4" },
];

function angleAt(lms: LM[], a: number, b: number, c: number): number | null {
  const A = lms[a], B = lms[b], C = lms[c];
  if (!A || !B || !C) return null;
  const r = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let deg = Math.abs((r * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

function trunkLean(lms: LM[]): number | null {
  const ls = lms[11], rs = lms[12], lh = lms[23], rh = lms[24];
  if (!ls || !rs || !lh || !rh) return null;
  const shx = (ls.x + rs.x) / 2, shy = (ls.y + rs.y) / 2;
  const hpx = (lh.x + rh.x) / 2, hpy = (lh.y + rh.y) / 2;
  return Math.abs((Math.atan2(shx - hpx, Math.max(1e-4, hpy - shy)) * 180) / Math.PI);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Status = "idle" | "loading" | "ready" | "error";

export function CameraCapture({ sessionId }: { sessionId?: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const analyzerRef = useRef<BrowserGaitAnalyzer | null>(null);
  const lastTsRef = useRef<number>(0);
  const lastSendRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mirrorRef = useRef<boolean>(true);
  const streamingRef = useRef<boolean>(false);
  const showAnglesRef = useRef<boolean>(true);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [fps, setFps] = useState(0);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    mirrorRef.current = mirror;
  }, [mirror]);
  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);
  useEffect(() => {
    showAnglesRef.current = showAngles;
  }, [showAngles]);

  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter((d) => d.kind === "videoinput");
      setDevices(cams);
      setDeviceId((cur) => cur || cams[0]?.deviceId || "");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureLandmarker() {
    if (landmarkerRef.current) return;
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
    const make = (delegate: "GPU" | "CPU") =>
      vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    try {
      landmarkerRef.current = await make("GPU");
    } catch {
      landmarkerRef.current = await make("CPU");
    }
  }

  async function startCamera() {
    setError(null);
    setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId }, width: 640, height: 480 } : { width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      await refreshDevices();
      await ensureLandmarker();
      analyzerRef.current = new BrowserGaitAnalyzer();
      setCameraOn(true);
      setStatus("ready");
      loop();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Could not start camera");
      setStatus("error");
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    wsRef.current?.close();
    wsRef.current = null;
    setCameraOn(false);
    setStreaming(false);
    setRecording(false);
    setDetected(false);
    setStatus("idle");
  }

  function loop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = landmarkerRef.current;
    if (!video || !canvas || !lm) return;

    let frames = 0;
    let fpsT = performance.now();

    const step = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        let ts = performance.now();
        if (ts <= lastTsRef.current) ts = lastTsRef.current + 1;
        lastTsRef.current = ts;

        let result: any;
        try {
          result = lm.detectForVideo(video, ts);
        } catch {
          result = null;
        }
        drawFrame(video, canvas, result);

        const lms: LM[] | undefined = result?.landmarks?.[0];
        if (lms && lms.length) {
          setDetected(true);
          const metrics = analyzerRef.current!.feed(lms, ts);
          const frame = {
            t: Date.now(),
            landmarks: lms.map((p) => [round(p.x), round(p.y), round(p.z ?? 0)]),
            metrics,
          };
          // Instant local skeleton + tiles
          useLiveStore.getState().setPose(frame as any);
          // Throttled stream to the backend fusion engine (~20 Hz)
          const now = performance.now();
          if (streamingRef.current && wsRef.current?.readyState === WebSocket.OPEN && now - lastSendRef.current >= 50) {
            lastSendRef.current = now;
            try {
              wsRef.current.send(JSON.stringify(frame));
            } catch {
              /* ignore */
            }
          }
        } else {
          setDetected(false);
        }

        frames++;
        const dt = performance.now() - fpsT;
        if (dt >= 1000) {
          setFps(Math.round((frames * 1000) / dt));
          frames = 0;
          fpsT = performance.now();
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function drawFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, result: any) {
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    if (mirrorRef.current) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    const lms: LM[] | undefined = result?.landmarks?.[0];
    if (lms) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = Math.max(2, w / 320);
      ctx.lineCap = "round";
      for (const [a, b] of BONES) {
        const pa = lms[a],
          pb = lms[b];
        if (!pa || !pb) continue;
        ctx.beginPath();
        ctx.moveTo(pa.x * w, pa.y * h);
        ctx.lineTo(pb.x * w, pb.y * h);
        ctx.stroke();
      }
      ctx.fillStyle = "#22d3ee";
      for (const i of DOTS) {
        const p = lms[i];
        if (!p) continue;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, Math.max(3, w / 200), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore(); // end mirror transform — text drawn upright below

    if (!lms || !showAnglesRef.current) return;
    const flip = mirrorRef.current;
    const sx = (p: LM) => (flip ? 1 - p.x : p.x) * w;
    const sy = (p: LM) => p.y * h;
    const fs = Math.max(11, Math.round(w / 42));

    // Angle value tag beside each joint
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${fs}px system-ui, sans-serif`;
    for (const j of ANGLE_JOINTS) {
      const deg = angleAt(lms, j.tri[0], j.tri[1], j.tri[2]);
      const p = lms[j.i];
      if (deg === null || !p) continue;
      const txt = `${Math.round(deg)}°`;
      const x = sx(p) + 9;
      const y = sy(p);
      const tw = ctx.measureText(txt).width;
      ctx.fillStyle = "rgba(3,10,20,0.72)";
      roundRect(ctx, x - 5, y - fs * 0.8, tw + 10, fs * 1.6, 5);
      ctx.fill();
      ctx.fillStyle = j.c;
      ctx.fillText(txt, x, y + 1);
    }

    // HUD panel — full angle read-out (also captured in recordings)
    const hf = Math.max(10, Math.round(w / 52));
    const rows: { k: string; c: string; deg: number | null }[] = ANGLE_JOINTS.map((j) => ({
      k: j.k,
      c: j.c,
      deg: angleAt(lms, j.tri[0], j.tri[1], j.tri[2]),
    }));
    rows.push({ k: "Trunk", c: "#f59e0b", deg: trunkLean(lms) });
    const pad = hf;
    const lh = hf * 1.55;
    const boxW = Math.min(w * 0.46, hf * 12);
    const boxH = lh * rows.length + hf * 2.4;
    ctx.fillStyle = "rgba(3,10,20,0.6)";
    roundRect(ctx, 12, 12, boxW, boxH, 10);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.font = `700 ${hf * 0.85}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.fillText("JOINT ANGLES", 12 + pad, 12 + hf * 1.4);
    let y = 12 + hf * 2.4 + lh * 0.2;
    for (const r of rows) {
      ctx.beginPath();
      ctx.arc(12 + pad + 4, y + lh / 2, hf * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = r.c;
      ctx.fill();
      ctx.font = `500 ${hf}px system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      ctx.textAlign = "left";
      ctx.fillText(r.k, 12 + pad + 16, y + lh / 2);
      ctx.textAlign = "right";
      ctx.font = `700 ${hf}px ui-monospace, monospace`;
      ctx.fillStyle = "#fff";
      ctx.fillText(r.deg === null ? "—" : `${Math.round(r.deg)}°`, 12 + boxW - pad, y + lh / 2);
      y += lh;
    }
  }

  async function toggleStreaming() {
    if (streaming) {
      wsRef.current?.close();
      wsRef.current = null;
      setStreaming(false);
      return;
    }
    if (!sessionId) return;
    const url = `${WS_BASE}/ws/ingest/vision?session=${sessionId}&token=${INGEST_TOKEN}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setStreaming(true);
    ws.onclose = () => setStreaming(false);
    ws.onerror = () => setStreaming(false);
  }

  function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gaitguard-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(a.href);
      setRecording(false);
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }

  // Restart the camera when the selected device changes while running.
  const onDeviceChange = async (id: string) => {
    setDeviceId(id);
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafRef.current);
      setTimeout(() => startCamera(), 50);
    }
  };

  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelHeader
        title="Live Camera · MediaPipe"
        icon={<Video size={14} />}
        right={
          <span
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-semibold",
              streaming ? "text-critical" : detected ? "text-good-ink" : "text-muted"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", streaming ? "animate-pulse bg-critical" : detected ? "bg-good" : "bg-muted")} />
            {streaming ? "STREAMING" : detected ? "TRACKING" : cameraOn ? "NO POSE" : "OFF"}
            {cameraOn && <span className="tnum ml-1 text-muted">{fps}fps</span>}
          </span>
        }
      />
      <PanelBody className="flex flex-1 flex-col gap-2 p-3">
        <div className="viewport relative flex-1 overflow-hidden">
          {/* hidden source video; canvas is the display */}
          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="h-full min-h-[220px] w-full object-contain" />

          {status !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white/70">
              {status === "loading" ? (
                <>
                  <RefreshCw size={22} className="animate-spin text-cyan-300" />
                  <span className="text-[12px]">Starting camera & loading MediaPipe…</span>
                </>
              ) : status === "error" ? (
                <>
                  <VideoOff size={22} className="text-red-400" />
                  <span className="max-w-xs text-[12px] text-red-300">{error}</span>
                </>
              ) : (
                <>
                  <Video size={26} className="text-cyan-300/70" />
                  <span className="text-[12px]">Camera off — press Start</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!cameraOn ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition hover:brightness-110"
            >
              <Video size={14} /> Start
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink-secondary hover:text-ink"
            >
              <VideoOff size={14} /> Stop
            </button>
          )}

          <button
            onClick={toggleStreaming}
            disabled={!cameraOn || !sessionId}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40",
              streaming ? "bg-critical text-white" : "border border-line bg-surface-2 text-ink-secondary hover:text-ink"
            )}
            title={!sessionId ? "No live session" : "Stream pose to the fusion engine"}
          >
            <Radio size={14} /> {streaming ? "Streaming" : "Stream"}
          </button>

          <button
            onClick={toggleRecord}
            disabled={!cameraOn}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40",
              recording ? "bg-critical/90 text-white" : "border border-line bg-surface-2 text-ink-secondary hover:text-ink"
            )}
          >
            {recording ? <Square size={13} /> : <Circle size={13} />} {recording ? "Stop rec" : "Record"}
          </button>

          <button
            onClick={() => setMirror((m) => !m)}
            disabled={!cameraOn}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-ink-secondary hover:text-ink disabled:opacity-40"
          >
            <Repeat size={13} /> {mirror ? "Mirror" : "Direct"}
          </button>

          <button
            onClick={() => setShowAngles((a) => !a)}
            disabled={!cameraOn}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40",
              showAngles ? "bg-accent/15 text-accent" : "border border-line bg-surface-2 text-ink-secondary hover:text-ink"
            )}
          >
            <Ruler size={13} /> Angles
          </button>

          {devices.length > 1 && (
            <select
              value={deviceId}
              onChange={(e) => onDeviceChange(e.target.value)}
              className="ml-auto max-w-[150px] rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] text-ink-secondary focus:outline-none"
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}

function round(v: number) {
  return Math.round(v * 1e4) / 1e4;
}
