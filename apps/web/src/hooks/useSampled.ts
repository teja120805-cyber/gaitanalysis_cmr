"use client";

import { useEffect, useState } from "react";

/**
 * Samples a getter on an interval instead of subscribing to a high-frequency
 * source — keeps React re-renders calm while the underlying frame stream runs
 * at 30–50 Hz. Used for readout tiles that don't need per-frame updates.
 */
export function useSampled<T>(getter: () => T, ms = 500): T {
  const [value, setValue] = useState<T>(getter);
  useEffect(() => {
    const id = setInterval(() => setValue(getter()), ms);
    return () => clearInterval(id);
    // getter is expected to be stable (a store getState closure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
  return value;
}
