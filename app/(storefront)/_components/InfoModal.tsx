"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLocale } from "../_lib/i18n";
import { useScrollLock } from "../_lib/scroll-lock";

export type InfoBlock = { heading: string; body: string };

export function InfoModal({
  open,
  onClose,
  title,
  blocks,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  blocks: InfoBlock[];
}) {
  const { d } = useLocale();
  useScrollLock(open);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[301] md:p-6 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white w-full md:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)] sticky top-0 bg-white">
                <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
                <button onClick={onClose} aria-label={d.cart.close} className="p-2 hover:text-[var(--brand)] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-5">
                {blocks.map((b, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold text-[var(--ink)] mb-1.5">{b.heading}</h3>
                    <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{b.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
