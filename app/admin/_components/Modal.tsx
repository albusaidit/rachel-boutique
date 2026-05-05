"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  const widthClass =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-xl";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[700]"
          />
          <div className="fixed inset-0 z-[701] flex items-start justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto w-full ${widthClass} mt-[10vh] mb-[6vh] bg-[var(--a-surface)] border border-[var(--a-line)] rounded-lg shadow-2xl overflow-hidden`}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--a-line)]">
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] p-1 -m-1"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5">{children}</div>
              {footer && (
                <div className="px-6 py-4 border-t border-[var(--a-line)] flex justify-end gap-2 bg-[var(--a-line-soft)]/40">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
