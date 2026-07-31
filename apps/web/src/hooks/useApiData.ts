"use client";

import { useEffect, useState } from "react";
import { USE_BACKEND } from "@/lib/config";

export type DataSource = "backend" | "demo";

export interface ApiState<T> {
  data: T;
  loading: boolean;
  source: DataSource;
}

/**
 * Fetches from the backend with graceful fallback to demo data — the same
 * philosophy as the live cockpit, so every page works with or without the API.
 * Respects NEXT_PUBLIC_USE_BACKEND ("0" forces demo).
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[] = []
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: fallback,
    loading: USE_BACKEND !== "0",
    source: "demo",
  });

  useEffect(() => {
    if (USE_BACKEND === "0") {
      setState({ data: fallback, loading: false, source: "demo" });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetcher()
      .then((d) => {
        if (!cancelled) setState({ data: d, loading: false, source: "backend" });
      })
      .catch(() => {
        if (!cancelled) setState({ data: fallback, loading: false, source: "demo" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
