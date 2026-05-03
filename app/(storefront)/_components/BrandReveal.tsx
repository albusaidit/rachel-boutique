"use client";

import { motion } from "framer-motion";
import { useLocale } from "../_lib/i18n";
import { BrandMark } from "./BrandMark";

export function BrandReveal() {
  const { d } = useLocale();
  return (
    <section
      className="relative overflow-hidden bg-white py-20 md:py-28 border-b border-[var(--line-soft)]"
      aria-label="RACHÉL"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.4, delay: 0.2 }}
          className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-[var(--ink-muted)] mb-10 md:mb-12 font-medium font-sans-latin"
        >
          {d.brand_reveal.maison}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.4 }}
        >
          <BrandMark size="hero" priority />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-10 md:mt-14 max-w-xl"
        >
          <p className="font-display text-2xl md:text-3xl text-[var(--ink)] leading-relaxed italic font-light">
            <span className="font-serif italic">{d.brand_reveal.tag_l1}</span>
            <br />
            <span className="font-serif">{d.brand_reveal.tag_l2}</span>
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-[10px] md:text-[11px] tracking-[0.4em] uppercase text-[var(--ink-muted)] font-sans-latin">
            <span className="w-10 h-px bg-[var(--ink-faint)]" />
            <span>{d.brand_reveal.sectors}</span>
            <span className="w-10 h-px bg-[var(--ink-faint)]" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
