"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** iOS-style segmented control with an animated sliding indicator. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-[10px] font-medium transition-colors",
              size === "sm" ? "px-3 py-1 text-[12px]" : "px-3.5 py-1.5 text-[13px]",
              active ? "text-ink" : "text-muted hover:text-ink-secondary"
            )}
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-[10px] bg-surface shadow-sm"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
