"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useLocale } from "../_lib/i18n";

type Loc = { ar: string; en: string; fr?: string };
type StoryOverride = { image?: string; eyebrow?: Loc; title?: Loc; body?: Loc };

export function Story({ content }: { content?: StoryOverride }) {
  const { d, locale } = useLocale();
  const pick = (loc?: Loc, fallback?: string) =>
    loc ? (loc[locale] ?? loc.en ?? fallback ?? "") : (fallback ?? "");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[var(--cream)] my-16 md:my-24"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
        <motion.div style={{ y }} className="relative aspect-[4/5] md:aspect-auto md:min-h-[600px]">
          <Image
            src={content?.image || "https://picsum.photos/seed/sr-story-atelier/1200/1500"}
            alt="RACHÉL atelier"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

        <div className="flex items-center px-6 md:px-16 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg"
          >
            <div className="text-[11px] tracking-[0.5em] uppercase text-[var(--ink-muted)] mb-5 font-medium font-sans-latin">
              {pick(content?.eyebrow, d.story.eyebrow)}
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-light leading-[1.05] mb-6 tracking-tight">
              {content?.title ? pick(content.title) : (<>{d.story.title_l1}<br />{d.story.title_l2}</>)}
            </h2>
            <p className="text-[var(--ink-soft)] text-base md:text-lg leading-relaxed mb-6">
              {pick(content?.body, d.story.body_p1)}
            </p>
            {!content?.body && (
              <p className="text-[var(--ink-soft)] text-base md:text-lg leading-relaxed mb-8">
                {d.story.body_p2}
              </p>
            )}
            <motion.a
              href="#"
              whileHover={{ x: locale === "ar" ? -6 : 6 }}
              className="inline-flex items-center gap-3 text-sm tracking-[0.3em] uppercase font-medium border-b-2 border-[var(--ink)] pb-1 hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors"
            >
              {d.story.cta}
              <span>{arrow}</span>
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
