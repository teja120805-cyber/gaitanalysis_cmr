"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="app-aura flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-critical/10 text-critical">
        <AlertTriangle size={26} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          An unexpected error occurred while rendering this view. Your session is safe — try again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => (window.location.href = "/")}>Go to dashboard</Button>
        <Button size="sm" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
