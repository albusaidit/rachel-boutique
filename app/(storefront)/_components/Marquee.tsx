"use client";

import { motion } from "framer-motion";
import { useLocale } from "../_lib/i18n";

export function Marquee({ items: itemsOverride }: { items?: { ar: string[]; en: string[]; fr: string[] } }) {
  const { d, locale } = useLocale();
  const items = itemsOverride && itemsOverride[locale]?.length > 0
    ? itemsOverride[locale]
    : d.marquee;
  const row = [...items, ...items, ...items];
  return (
    <div className="bg-[var(--ink)] text-white overflow-hidden py-3 border-y border-[var(--ink)]">
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {row.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-16 text-xs tracking-[0.3em] uppercase"
          >
            <span>{item}</span>
            <span className="text-[var(--brand-light)]">◆</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
