"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/** Shared easing — a calm, premium curve used across the app. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Container that staggers its children into view. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Item that rises + fades in. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Stagger({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * The signature card: rises into view, lifts subtly on hover, and can glow at
 * its top edge with the brand gradient. Every dashboard tile is one of these.
 */
export function MotionCard({
  className,
  children,
  hover = true,
  accent = false,
  ...props
}: HTMLMotionProps<"div"> & { hover?: boolean; accent?: boolean }) {
  return (
    <motion.div
      variants={riseIn}
      whileHover={
        hover
          ? { y: -3, boxShadow: "var(--shadow-pop)", transition: { duration: 0.25, ease: EASE } }
          : undefined
      }
      className={cn("panel relative overflow-hidden", className)}
      {...props}
    >
      {accent && (
        <span className="brand-gradient pointer-events-none absolute inset-x-0 top-0 h-[3px] opacity-80" />
      )}
      {children as React.ReactNode}
    </motion.div>
  );
}

/** Page-level fade/slide wrapper for route content. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
