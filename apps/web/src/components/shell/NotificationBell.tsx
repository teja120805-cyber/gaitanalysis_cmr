"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useApiData } from "@/hooks/useApiData";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  tone: "critical" | "warning" | "info";
  title: string;
  detail: string;
  time: string;
}

interface ApiNotification {
  id: string;
  channel: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

const NOTES: Note[] = [
  { id: "n1", tone: "critical", title: "High fall-risk · Priya Nadar", detail: "Freezing episode detected in Rehab-2 · 204", time: "2m" },
  { id: "n2", tone: "warning", title: "Gait deviation · Eleanor Whitfield", detail: "Reduced arm swing trending up", time: "11m" },
  { id: "n3", tone: "info", title: "Session completed", detail: "Marcus Bell · 32-min walk assessment", time: "40m" },
];

function toneFor(title: string): Note["tone"] {
  const t = title.toLowerCase();
  if (t.includes("high") || t.includes("fall")) return "critical";
  if (t.includes("deviation") || t.includes("gait") || t.includes("battery")) return "warning";
  return "info";
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(diff / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

const TONE = {
  critical: { icon: AlertTriangle, cls: "text-critical", bg: "bg-critical/10" },
  warning: { icon: Activity, cls: "text-warning-ink", bg: "bg-warning/10" },
  info: { icon: CheckCircle2, cls: "text-primary", bg: "bg-primary-soft" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const { data: apiNotes } = useApiData<ApiNotification[] | null>(
    () => apiGet<ApiNotification[]>("/api/notifications"),
    null,
    []
  );
  const notes: Note[] = apiNotes
    ? apiNotes.map((n) => ({
        id: n.id,
        tone: toneFor(n.title),
        title: n.title,
        detail: n.body,
        time: relTime(n.created_at),
      }))
    : NOTES;
  const unread = apiNotes ? apiNotes.filter((n) => !n.read).length : 2;

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-secondary transition-colors hover:text-ink"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[9px] font-bold text-white ring-2 ring-surface">
            {unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              <span className="rounded-full bg-critical/10 px-2 py-0.5 text-[10px] font-semibold text-critical-ink">
                {unread} new
              </span>
            </div>
            <div className="max-h-80 overflow-auto">
              {notes.map((n) => {
                const t = TONE[n.tone];
                const Icon = t.icon;
                return (
                  <button
                    key={n.id}
                    className="flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
                  >
                    <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.bg)}>
                      <Icon size={15} className={t.cls} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {n.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {n.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-muted">{n.time}</span>
                  </button>
                );
              })}
            </div>
            <button className="w-full py-2.5 text-center text-[12px] font-medium text-primary transition-colors hover:bg-surface-2">
              View all alerts
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
