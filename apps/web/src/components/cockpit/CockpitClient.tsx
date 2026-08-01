"use client";

import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useLiveStore } from "@/lib/store";
import type { Patient } from "@/lib/types";
import { ConnectDevice } from "./ConnectDevice";
import { SessionHeader } from "./SessionHeader";
import { RiskGauge } from "./RiskGauge";
import { DriverBreakdown } from "./DriverBreakdown";
import { FootHeatmap } from "./FootHeatmap";
import { SensorReadout } from "./SensorReadout";
import { FootPressureDistribution } from "./FootPressureDistribution";
import { DetectedEvents } from "./DetectedEvents";
import { LiveGaitMetrics } from "./LiveGaitMetrics";
import { CameraCapture } from "./CameraCapture";
import { RiskTimeline } from "./RiskTimeline";
import { AlertsFeed } from "./AlertsFeed";

export function CockpitClient({
  patient,
  joinSessionId,
}: {
  patient: Patient;
  joinSessionId?: string;
}) {
  const { source, sessionId } = useLiveSession(patient.id, joinSessionId);
  const hasData = useLiveStore(
    (s) => s.latestRisk !== null || s.latestPose !== null || s.sensorBuf.length > 0
  );

  return (
    <AppShell
      title="Live Patient Monitor"
      subtitle={`${patient.name} · ${patient.room} · ${
        source === "offline"
          ? "backend offline"
          : source === "backend"
          ? hasData
            ? "live device feed"
            : "awaiting sensor data"
          : "connecting…"
      }`}
    >
      <motion.div
        className="mx-auto max-w-[1700px] space-y-3 p-4 sm:p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <SessionHeader patient={patient} />

        {source === "offline" && (
          <div className="flex items-center gap-3 rounded-clinical border border-critical/30 bg-critical/10 px-4 py-3 text-[13px] text-critical-ink">
            <WifiOff size={16} className="shrink-0" />
            <span>
              Backend offline — start the GaitGuard API (<code className="rounded bg-black/10 px-1">uvicorn app.main:app</code>) to stream live data.
            </span>
          </div>
        )}
        {source === "backend" && !hasData && (
          <ConnectDevice patientId={patient.id} sessionId={sessionId} />
        )}

        <div className="grid grid-cols-12 gap-3">
          {/* LEFT — Live camera (recording) + live gait metrics */}
          <div className="col-span-12 flex flex-col gap-3 xl:col-span-4">
            <CameraCapture sessionId={sessionId} />
            <LiveGaitMetrics />
          </div>

          {/* CENTER — pressure heatmap + distribution */}
          <div className="col-span-12 flex flex-col gap-3 xl:col-span-4">
            <FootHeatmap />
            <FootPressureDistribution />
          </div>

          {/* RIGHT — risk gauge, live sensor values, drivers */}
          <div className="col-span-12 flex flex-col gap-3 xl:col-span-4">
            <RiskGauge />
            <SensorReadout />
            <DriverBreakdown />
          </div>

          {/* BOTTOM — timeline, detected events, alerts */}
          <div className="col-span-12 xl:col-span-8">
            <div className="flex h-full flex-col gap-3">
              <RiskTimeline />
              <DetectedEvents />
            </div>
          </div>
          <div className="col-span-12 xl:col-span-4">
            <AlertsFeed />
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
