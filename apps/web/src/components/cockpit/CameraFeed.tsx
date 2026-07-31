"use client";

import { motion } from "framer-motion";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { useLiveStore } from "@/lib/store";
import { useSampled } from "@/hooks/useSampled";
import { Video } from "lucide-react";

/**
 * Live camera panel — a stylized viewport standing in for the ward camera, with a
 * MediaPipe pose overlay drawn from the current landmarks (the real feed would
 * composite the video behind this). Keeps the imaging-viewport (dark) treatment.
 */
const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
];

export function CameraFeed() {
  const pose = useSampled(() => useLiveStore.getState().latestPose, 60);
  const lm = pose?.landmarks ?? [];

  const pt = (i: number) => {
    const p = lm[i];
    if (!p) return null;
    return { x: p[0] * 100, y: p[1] * 100 };
  };

  return (
    <Panel className="flex flex-col overflow-hidden">
      <PanelHeader
        title="Live Camera"
        icon={<Video size={14} />}
        right={
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-critical">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-critical" /> REC
          </span>
        }
      />
      <PanelBody className="flex-1 p-3">
        <div className="viewport relative h-full min-h-[220px] w-full overflow-hidden">
          {/* scanning sweep */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-cyan-400/10 to-transparent"
            animate={{ top: ["-10%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          {/* corner frame markers */}
          {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "left-2 bottom-2 border-l-2 border-b-2", "right-2 bottom-2 border-r-2 border-b-2"].map((c) => (
            <span key={c} className={`absolute h-5 w-5 border-cyan-400/50 ${c}`} />
          ))}

          {/* pose overlay */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
            {BONES.map(([a, b], i) => {
              const pa = pt(a), pb = pt(b);
              if (!pa || !pb) return null;
              return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#38bdf8" strokeWidth={0.8} strokeLinecap="round" opacity={0.9} />;
            })}
            {[0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map((i) => {
              const p = pt(i);
              if (!p) return null;
              return <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 1.6 : 1} fill="#22d3ee" />;
            })}
          </svg>

          <div className="absolute bottom-2 left-3 text-[10px] font-medium text-cyan-300/80">
            MediaPipe Pose · 33 landmarks
          </div>
          {lm.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[12px] text-white/50">
              Awaiting camera stream…
            </div>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
