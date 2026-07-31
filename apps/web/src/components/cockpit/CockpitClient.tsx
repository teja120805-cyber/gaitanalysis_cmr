"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AppShell } from "@/components/shell/AppShell";
import { useLiveSession } from "@/hooks/useLiveSession";
import type { Patient } from "@/lib/types";
import { SessionHeader } from "./SessionHeader";
import { RiskGauge } from "./RiskGauge";
import { DriverBreakdown } from "./DriverBreakdown";
import { FootHeatmap } from "./FootHeatmap";
import { SensorReadout } from "./SensorReadout";
import { FootPressureDistribution } from "./FootPressureDistribution";
import { CenterOfPressure } from "./CenterOfPressure";
import { DetectedEvents } from "./DetectedEvents";
import { CameraFeed } from "./CameraFeed";
import { RiskTimeline } from "./RiskTimeline";
import { AlertsFeed } from "./AlertsFeed";

// Three.js must not run on the server.
const Skeleton3D = dynamic(
  () => import("./Skeleton3D").then((m) => m.Skeleton3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[300px] items-center justify-center rounded-clinical border border-line bg-surface text-xs text-muted">
        Initializing 3D pose engine…
      </div>
    ),
  }
);

export function CockpitClient({ patient }: { patient: Patient }) {
  const source = useLiveSession(patient.id);

  return (
    <AppShell
      title="Live Patient Monitor"
      subtitle={`${patient.name} · ${patient.room} · ${
        source === "backend"
          ? "live fusion via GaitGuard API"
          : source === "simulated"
          ? "local simulation (API offline)"
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

        <div className="grid grid-cols-12 gap-3">
          {/* LEFT — Live camera + 3D skeleton overlay */}
          <div className="col-span-12 flex flex-col gap-3 xl:col-span-4">
            <CameraFeed />
            <Skeleton3D />
          </div>

          {/* CENTER — pressure heatmap, distribution, CoP */}
          <div className="col-span-12 flex flex-col gap-3 xl:col-span-4">
            <FootHeatmap />
            <FootPressureDistribution />
            <CenterOfPressure />
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
