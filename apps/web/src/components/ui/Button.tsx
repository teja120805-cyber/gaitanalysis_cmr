"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "brand-gradient text-white shadow-[0_6px_18px_-6px_rgba(37,99,235,0.6)] hover:shadow-[0_10px_26px_-8px_rgba(37,99,235,0.7)]",
  secondary:
    "bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-surface-3",
  outline:
    "border border-primary/40 text-primary hover:bg-primary-soft",
  ghost: "text-ink-secondary hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-critical text-white hover:brightness-110 shadow-[0_6px_18px_-6px_rgba(239,68,68,0.5)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: HTMLMotionProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
