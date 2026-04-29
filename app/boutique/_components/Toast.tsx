"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "info" | "error";
type Toast = { id: number; msg: string; kind: ToastKind };

const ToastContext = createContext<{ push: (msg: string, kind?: ToastKind) => void } | null>(
  null,
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 inset-inline-start-6 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ insetInlineStart: "1.5rem" }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`pointer-events-auto rounded-sm px-5 py-3 shadow-lg text-sm font-medium tracking-wide ${
                t.kind === "success"
                  ? "bg-[#1a1a1a] text-white"
                  : t.kind === "error"
                    ? "bg-red-900 text-white"
                    : "bg-white text-[#1a1a1a] border border-[#ebe7e3]"
              }`}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
