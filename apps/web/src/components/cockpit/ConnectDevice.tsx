"use client";

import { useState } from "react";
import { Check, Copy, Cpu, Link2, Radio, Video } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { useToast } from "@/components/ui/Toast";
import { API_BASE, INGEST_TOKEN } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Shown in the cockpit while a session is live but no device is streaming yet.
 * Surfaces the exact join URL + per-session device recipes so the user can wire
 * up an ESP32 / camera without hand-editing session ids.
 */
export function ConnectDevice({
  patientId,
  sessionId,
}: {
  patientId: string;
  sessionId: string | null;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const host = API_BASE.replace(/^https?:\/\//, ""); // e.g. localhost:8000
  const port = host.split(":")[1] || "8000";
  const sid = sessionId ?? "pt-1042";
  const joinUrl = `${origin}/monitor/${patientId}?session=${sid}`;

  const esp32Config = [
    `BACKEND_HOST = "<your-PC-IP>"   // run: ipconfig  (IPv4)`,
    `BACKEND_PORT = ${port}`,
    `SESSION_ID   = "${sid}"`,
    `INGEST_TOKEN = "${INGEST_TOKEN}"`,
  ].join("\n");
  const bridgeCmd = `python apps/bridge/esp32_bridge.py --esp32 <esp32-ip> --session ${sid}`;
  const workerCmd = `python apps/vision/worker.py --session ${sid} --display`;

  return (
    <Panel className="border-primary/25">
      <PanelHeader
        title="Connect a device"
        icon={<Radio size={14} />}
        right={
          <span className="tnum rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
            session {sid}
          </span>
        }
      />
      <PanelBody className="space-y-3">
        <p className="text-[13px] text-ink-secondary">
          This session is live and waiting for sensor data. Point a device at it, then this page
          shows the real feed automatically.
        </p>

        <Field icon={<Link2 size={13} />} label="Dashboard URL (this session)" value={joinUrl} mono={false} />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Recipe
            icon={<Cpu size={15} className="text-primary" />}
            title="ESP32 insole · firmware"
            hint="Edit the top of firmware/esp32/gaitguard_esp32.ino, then flash."
            value={esp32Config}
          />
          <Recipe
            icon={<Cpu size={15} className="text-accent" />}
            title="ESP32 insole · bridge"
            hint="Keep your original sketch; run on the PC."
            value={bridgeCmd}
          />
          <Recipe
            icon={<Video size={15} className="text-accent" />}
            title="Camera · vision worker"
            hint="Or use the Live Camera panel → Start → Stream."
            value={workerCmd}
          />
        </div>

        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11px] text-muted">
          Same WiFi for the ESP32, this PC, and your browser · start the API with{" "}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">--host 0.0.0.0</code> · allow port {port} through the firewall.
        </div>
      </PanelBody>
    </Panel>
  );
}

function Recipe({
  icon,
  title,
  hint,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  value: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-semibold text-ink">{title}</span>
      </div>
      <div className="mb-2 text-[10.5px] leading-snug text-muted">{hint}</div>
      <CodeBlock value={value} />
    </div>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <div className="relative mt-auto">
      <pre className="tnum max-h-40 overflow-x-auto rounded-lg border border-line bg-surface px-3 py-2 pr-9 text-[11px] leading-relaxed text-ink-secondary">
        <code>{value}</code>
      </pre>
      <div className="absolute right-1.5 top-1.5">
        <CopyBtn text={value} />
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-surface px-2.5 py-1.5 text-[12px] text-primary">
          {value}
        </code>
        <CopyBtn text={value} />
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          toast({ tone: "success", title: "Copied to clipboard" });
          setTimeout(() => setDone(false), 1200);
        } catch {
          toast({ tone: "error", title: "Copy failed", detail: "Select and copy manually." });
        }
      }}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink",
        done && "text-good-ink"
      )}
      aria-label="Copy"
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
