"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[700]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ width, maxWidth: "100vw" }}
            className="fixed top-0 end-0 h-screen z-[701] bg-[var(--a-surface)] border-s border-[var(--a-line)] shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="flex items-start justify-between gap-3 px-6 py-4 border-b border-[var(--a-line)]">
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight truncate">{title}</h2>
                {subtitle && (
                  <div className="text-xs text-[var(--a-ink-muted)] mt-0.5 truncate">{subtitle}</div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] p-1 -m-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="px-6 py-4 border-t border-[var(--a-line)] flex justify-end gap-2 bg-[var(--a-line-soft)]/40">
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
