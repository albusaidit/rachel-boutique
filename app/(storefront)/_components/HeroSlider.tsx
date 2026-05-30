"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { heroSlides as defaultHeroSlides, pickLocale, type HeroSlide } from "../_lib/products";
import { useLocale } from "../_lib/i18n";

const AUTOPLAY_MS = 6500;

export function HeroSlider({ slides }: { slides?: HeroSlide[] }) {
  const { locale, d } = useLocale();
  const list = slides && slides.length > 0 ? slides : defaultHeroSlides;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: 1 | -1) => setI((v) => (v + dir + list.length) % list.length),
    [list.length],
  );

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [i, paused, go]);

  const slide = list[i];
  const alignMap = {
    start: "items-start text-start",
    center: "items-center text-center",
    end: "items-end text-end",
  };

  const eyebrow = pickLocale(slide.eyebrow, locale);
  const title = pickLocale(slide.title, locale);
  const sub = pickLocale(slide.sub, locale);
  const cta = pickLocale(slide.cta, locale);
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <section
      className="relative w-full bg-[var(--cream)] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ height: "min(88vh, 760px)" }}
      aria-roledescription="carousel"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={title}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/30" />
        </motion.div>
      </AnimatePresence>

      <div className={`relative z-10 h-full flex flex-col justify-end px-6 md:px-16 pb-20 md:pb-24 max-w-[1500px] mx-auto ${alignMap[slide.align]}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={i + locale}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="max-w-xl"
          >
            <div className="text-[11px] md:text-xs tracking-[0.5em] uppercase text-white/90 mb-4 font-medium">
              {eyebrow}
            </div>
            <h1 className="font-serif text-5xl md:text-[88px] font-light leading-[0.95] text-white mb-6 tracking-tight">
              {title}
            </h1>
            <p className="text-white/85 text-base md:text-lg mb-8 max-w-md leading-relaxed">
              {sub}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 bg-white text-[#1a1a1a] px-7 py-3.5 text-xs tracking-[0.3em] uppercase font-medium hover:bg-[var(--ink)] hover:text-white transition-colors"
            >
              {cta}
              <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">{arrow}</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {list.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={d.product_grid.slide_label(idx + 1)}
            className="h-[3px] transition-all duration-500"
            style={{
              width: idx === i ? 40 : 20,
              background: idx === i ? "white" : "rgba(255,255,255,0.5)",
            }}
          />
        ))}
      </div>

      <button
        onClick={() => go(-1)}
        aria-label={d.product_grid.prev}
        className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white transition-colors items-center justify-center text-[#1a1a1a] hidden md:flex"
        style={{ insetInlineEnd: "1.25rem" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => go(1)}
        aria-label={d.product_grid.next}
        className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white transition-colors items-center justify-center text-[#1a1a1a] hidden md:flex"
        style={{ insetInlineStart: "1.25rem" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
