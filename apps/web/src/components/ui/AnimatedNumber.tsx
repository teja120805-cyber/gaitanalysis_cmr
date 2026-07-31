"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/** Counts up to `value` on mount / change — the premium KPI feel. */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1.1,
  suffix = "",
  prefix = "",
}: {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const controls = animate(ref.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    ref.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className="tnum">
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
