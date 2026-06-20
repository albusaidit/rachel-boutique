"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { categoryTree, type CategoryKey } from "../_lib/products";
import { useLocale } from "../_lib/i18n";
import { useStorefrontUI } from "../_lib/storefront-ui";

const HEADER = {
  ar: { eyebrow: "تسوقي حسب القسم", title: "كل ما تبحثين عنه، مختار بعناية", shop: "تسوّقي" },
  en: { eyebrow: "Shop by category", title: "Everything you're looking for, curated", shop: "Shop" },
  fr: { eyebrow: "Acheter par catégorie", title: "Tout ce que vous cherchez, sélectionné", shop: "Découvrir" },
} as const;

function CategoryIcon({ k }: { k: CategoryKey }) {
  const paths: Record<CategoryKey, React.ReactNode> = {
    clothing: (
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    ),
    shoes: (
      <>
        <path d="M2 8v7a2 2 0 0 0 2 2h13l3.4-1.1c1.6-.5 1.6-2.8 0-3.4L13 9V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
        <path d="M2 13h11" />
      </>
    ),
    "hair-tools": (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M8.1 8.1 20 20M20 4 8.1 15.9" />
      </>
    ),
    beauty: (
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    ),
    perfumes: (
      <>
        <rect x="7.5" y="9" width="9" height="12" rx="2" />
        <path d="M10 9V5.5h4V9M9.5 3.5h5" />
        <path d="M18 6h2M18 9h2" />
      </>
    ),
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[k]}
    </svg>
  );
}

export function CategoryBanners({ imageOverrides }: { imageOverrides?: Record<string, string> }) {
  const { locale } = useLocale();
  const { openBrowse } = useStorefrontUI();
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
              onClick={() => openBrowse({ type: "category", key: c.key })}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              aria-label={label}
              className="group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[var(--cream)] cursor-pointer rounded-sm"
            >
              <Image
                src={imageOverrides?.[c.key] || c.heroImage}
                alt={label}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-colors duration-500 group-hover:from-black/85" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-white/25 transition-all duration-500 rounded-sm" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 md:pb-7 px-3 text-center">
                <span className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-3 text-white transition-transform duration-500 group-hover:-translate-y-1">
                  <CategoryIcon k={c.key} />
                </span>
                <div className="text-white text-lg md:text-xl font-serif tracking-wide">
                  {label}
                </div>
                <span className="block h-px w-6 bg-white/50 mt-2.5 transition-all duration-500 group-hover:w-12" aria-hidden />
                <div className="overflow-hidden h-5 mt-2">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-white translate-y-5 group-hover:translate-y-0 transition-transform duration-500 font-sans-latin">
                    {h.shop} <span className="rtl:hidden">→</span><span className="hidden rtl:inline">←</span>
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
