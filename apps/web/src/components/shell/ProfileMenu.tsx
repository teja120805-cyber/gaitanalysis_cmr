"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Settings, User, LifeBuoy } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-line-strong"
      >
        <span className="brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white">
          RO
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[12px] font-semibold text-ink">Dr. R. Okonkwo</span>
          <span className="block text-[10px] text-muted">Neurology · Clinician</span>
        </span>
        <ChevronDown size={14} className="text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass-strong absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white">
                RO
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">Dr. R. Okonkwo</div>
                <div className="text-[11px] text-muted">okonkwo@gaitguard.health</div>
              </div>
            </div>
            <div className="p-1.5">
              {[
                { icon: User, label: "My profile", href: "/settings" },
                { icon: Settings, label: "Preferences", href: "/settings" },
                { icon: LifeBuoy, label: "Help & support", href: "/settings" },
              ].map((it) => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.label}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink-secondary transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Icon size={15} className="text-muted" />
                    {it.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-line p-1.5">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-critical-ink transition-colors hover:bg-critical/10">
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
