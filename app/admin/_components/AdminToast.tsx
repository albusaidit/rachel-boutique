"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++idRef.current;
    setItems((arr) => [...arr, { id, message, tone }]);
    setTimeout(() => {
      setItems((arr) => arr.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 inset-inline-end-4 z-[600] flex flex-col gap-2 items-end max-w-[360px]">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto px-4 py-3 rounded shadow-lg border text-sm flex items-start gap-2.5 backdrop-blur-md ${
                t.tone === "success"
                  ? "bg-[var(--a-success-bg)] border-[color:color-mix(in_srgb,var(--a-success)_35%,transparent)] text-[var(--a-success)]"
                  : t.tone === "error"
                    ? "bg-[var(--a-danger-bg)] border-[var(--a-danger-line)] text-[var(--a-danger)]"
                    : "bg-[var(--a-surface)] border-[var(--a-line)] text-[var(--a-ink)]"
              }`}
            >
              <span aria-hidden className="leading-none mt-0.5">
                {t.tone === "success" ? "✓" : t.tone === "error" ? "✕" : "ℹ"}
              </span>
              <span className="flex-1">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: (message: string) => {
        if (typeof window !== "undefined") console.log("[toast]", message);
      },
    };
  }
  return ctx;
}

export function useActionToast() {
  const { push } = useAdminToast();
  const run = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      messages: { success: string; error?: string },
    ): Promise<T | null> => {
      try {
        const result = await fn();
        push(messages.success, "success");
        return result;
      } catch (err) {
        const errMsg =
          messages.error ??
          (err instanceof Error ? err.message : "Something went wrong");
        push(errMsg, "error");
        return null;
      }
    },
    [push],
  );
  return run;
}

export function useToastFromSearchParam() {
  const { push } = useAdminToast();
  useEffect(() => {
    const url = new URL(window.location.href);
    const msg = url.searchParams.get("toast");
    const tone = (url.searchParams.get("tone") as ToastTone) || "success";
    if (msg) {
      push(msg, tone);
      url.searchParams.delete("toast");
      url.searchParams.delete("tone");
      window.history.replaceState({}, "", url.toString());
    }
  }, [push]);
}
