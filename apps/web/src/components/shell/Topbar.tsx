"use client";

import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import { clock } from "@/lib/utils";

export function Topbar({
  title,
  subtitle,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-secondary lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="truncate text-[11px] text-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted md:flex">
          <Search size={15} />
          <input
            placeholder="Search patients, MRN…"
            className="w-40 bg-transparent text-ink placeholder:text-muted focus:outline-none xl:w-52"
          />
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-muted">
            /
          </kbd>
        </div>

        <div className="tnum hidden text-right text-[11px] leading-tight text-ink-secondary lg:block">
          <div className="font-semibold text-ink">{now ? clock(now) : "--:--:--"}</div>
          <div className="text-[10px] text-muted">
            {now
              ? now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
              : ""}
          </div>
        </div>

        <ThemeToggle />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
