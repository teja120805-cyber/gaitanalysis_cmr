import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into [min, max]. */
export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Format a HH:MM:SS clock from a Date. */
export function clock(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

/** mm:ss elapsed from a start timestamp. */
export function elapsed(fromMs: number, nowMs: number) {
  const s = Math.max(0, Math.floor((nowMs - fromMs) / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
