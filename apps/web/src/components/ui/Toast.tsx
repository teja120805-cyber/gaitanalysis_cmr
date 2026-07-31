"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "warning" | "info";
interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  detail?: string;
}

const ToastCtx = createContext<{
  toast: (t: Omit<Toast, "id">) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

const TONE = {
  success: { icon: CheckCircle2, cls: "text-good-ink", bar: "bg-good" },
  error: { icon: XCircle, cls: "text-critical-ink", bar: "bg-critical" },
  warning: { icon: AlertTriangle, cls: "text-warning-ink", bar: "bg-warning" },
  info: { icon: Info, cls: "text-primary", bar: "bg-primary" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((ts) => [...ts, { ...t, id }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const meta = TONE[t.tone];
            const Icon = meta.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="glass-strong pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-line p-3.5 shadow-pop"
              >
                <span className={cn("absolute inset-y-0 left-0 w-1", meta.bar)} />
                <Icon size={18} className={cn("mt-0.5 shrink-0", meta.cls)} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink">{t.title}</div>
                  {t.detail && <div className="text-[12px] text-ink-secondary">{t.detail}</div>}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
