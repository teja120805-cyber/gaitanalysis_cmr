"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  BellRing,
  Settings,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/patients", label: "Patients", icon: Users, match: (p: string) => p.startsWith("/patients") },
  { href: "/monitor/pt-1042", label: "Live Monitoring", icon: Activity, match: (p: string) => p.startsWith("/monitor") },
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: (p: string) => p.startsWith("/analytics") },
  { href: "/reports", label: "Reports", icon: FileText, match: (p: string) => p.startsWith("/reports") },
  { href: "/alerts", label: "Alerts", icon: BellRing, match: (p: string) => p.startsWith("/alerts") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();

  return (
    <div className="flex h-full w-[248px] flex-col glass border-r border-line">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.7)]">
          <Waves size={19} strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-ink">
            Gait<span className="brand-text">Guard</span>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Clinical Suite
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Monitoring
        </div>
        {NAV.map((item) => {
          const active = item.match(path);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-primary-ink" : "text-ink-secondary hover:text-ink"
              )}
            >
              {active && (
                <motion.span
                  layoutId="side-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl border border-primary/15 bg-primary-soft"
                />
              )}
              <Icon
                size={18}
                className={cn(
                  "relative z-10 transition-colors",
                  active ? "text-primary" : "text-muted group-hover:text-ink-secondary"
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System status card */}
      <div className="p-3">
        <div className="rounded-xl border border-line bg-surface-2/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-ink-secondary">
              System status
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-good-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
              </span>
              OPERATIONAL
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg bg-surface px-2 py-1.5">
              <div className="text-muted">Devices</div>
              <div className="tnum font-semibold text-ink">12 / 12</div>
            </div>
            <div className="rounded-lg bg-surface px-2 py-1.5">
              <div className="text-muted">Latency</div>
              <div className="tnum font-semibold text-ink">38 ms</div>
            </div>
          </div>
        </div>
        <div className="px-2 pt-3 text-[10px] leading-relaxed text-muted">
          v0.1.0 · demo build · simulated data
        </div>
      </div>
    </div>
  );
}
