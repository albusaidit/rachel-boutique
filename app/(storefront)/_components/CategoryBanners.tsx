"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { categoryTree } from "../_lib/products";
import { useLocale } from "../_lib/i18n";

const HEADER = {
  ar: { eyebrow: "تسوقي حسب القسم", title: "كل ما تبحثين عنه، مختار بعناية", sections: "أقسام" },
  en: { eyebrow: "Shop by category", title: "Everything you're looking for, curated", sections: "sections" },
  fr: { eyebrow: "Acheter par catégorie", title: "Tout ce que vous cherchez, sélectionné", sections: "sections" },
} as const;

export function CategoryBanners() {
  const { locale } = useLocale();
  const h = HEADER[locale];
  return (
    <section className="max-w-[1500px] mx-auto px-5 md:px-8 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-10"
      >
        <div className="text-[11px] tracking-[0.4em] uppercase text-[var(--ink-muted)] mb-3 font-medium font-sans-latin">
          {h.eyebrow}
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight">
          {h.title}
        </h2>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
        {categoryTree.map((c, i) => {
          const label = c[locale] || c.en;
          return (
            <motion.button
              key={c.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="group relative aspect-[4/5] md:aspect-square overflow-hidden bg-[var(--cream)] cursor-pointer"
            >
              <Image
                src={c.heroImage}
                alt={label}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 transition-opacity group-hover:from-black/75" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 md:pb-6 px-3">
                <div className="text-2xl md:text-3xl mb-2" aria-hidden>
                  {c.icon}
                </div>
                <div className="text-white text-lg md:text-xl font-serif tracking-wide mb-1">
                  {label}
                </div>
                <div className="overflow-hidden h-5">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white/90 transform translate-y-5 group-hover:translate-y-0 transition-transform duration-500 font-sans-latin">
                    {c.subcategories.length} {h.sections} →
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
