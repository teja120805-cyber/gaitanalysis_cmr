"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

/** Premium light/dark switch with a sliding thumb and cross-fading icons. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-8 w-[58px] items-center rounded-full border border-line bg-surface-2 px-1 transition-colors hover:border-line-strong"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-sm"
        style={{ marginLeft: isDark ? 26 : 0 }}
      >
        {isDark ? (
          <Moon size={13} className="text-primary" />
        ) : (
          <Sun size={14} className="text-warning" />
        )}
      </motion.span>
      <Sun
        size={13}
        className={`pointer-events-none absolute left-2 text-muted transition-opacity ${
          isDark ? "opacity-40" : "opacity-0"
        }`}
      />
      <Moon
        size={12}
        className={`pointer-events-none absolute right-2 text-muted transition-opacity ${
          isDark ? "opacity-0" : "opacity-40"
        }`}
      />
    </button>
  );
}
