"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// A branded welcome overlay shown once per browser session when entering the
// admin. Auto-dismisses after a beat, then fades to reveal the dashboard.
export function WelcomeSplash({ name }: { name?: string | null }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("rachel_admin_splash") === "1") return;
      sessionStorage.setItem("rachel_admin_splash", "1");
    } catch {
      /* sessionStorage unavailable — just show it */
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "var(--a-bg)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* ambient aurora behind the mark */}
          <div className="admin-aurora">
            <span className="blob blob-1" />
            <span className="blob blob-2" />
            <span className="blob blob-3" />
          </div>

          <motion.div
            className="relative z-10 text-center px-6"
            initial={{ opacity: 0, y: 16, filter: "blur(12px)", scale: 0.96 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="admin-logo-shimmer font-serif uppercase tracking-[0.32em] text-4xl md:text-5xl leading-none">
              RACHÉL
            </div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-4 text-[11px] tracking-[0.45em] uppercase text-[var(--a-ink-muted)]"
            >
              {name ? `Welcome, ${name}` : "Admin"}
            </motion.div>

            {/* indeterminate loader sweep */}
            <div className="mt-7 h-[2px] w-44 mx-auto bg-[var(--a-line)] overflow-hidden rounded-full">
              <motion.div
                className="h-full w-1/2 bg-[var(--a-accent)] rounded-full"
                initial={{ x: "-110%" }}
                animate={{ x: "230%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
