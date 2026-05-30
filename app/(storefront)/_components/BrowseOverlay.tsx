"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import {
  products,
  productsIn,
  categoryLabel,
  subcategoryLabel,
} from "../_lib/products";
import { useLocale } from "../_lib/i18n";
import { useStorefrontUI } from "../_lib/storefront-ui";
import { useScrollLock } from "../_lib/scroll-lock";
import { ProductCard } from "./ProductCard";

export function BrowseOverlay() {
  const { browse, closeBrowse, openQuickView } = useStorefrontUI();
  const { locale, d } = useLocale();

  useScrollLock(!!browse);

  useEffect(() => {
    if (!browse) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBrowse();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [browse, closeBrowse]);

  const list = browse
    ? browse.type === "category"
      ? productsIn(browse.key)
      : browse.type === "subcategory"
        ? productsIn(undefined, browse.key)
        : products.filter((p) => p.tags.includes(browse.key))
    : [];

  const title = !browse
    ? ""
    : browse.type === "category"
      ? categoryLabel(browse.key, locale)
      : browse.type === "subcategory"
        ? subcategoryLabel(browse.key, locale)
        : browse.key === "new"
          ? d.product_grid.filter_new
          : d.product_grid.filter_sale;

  return (
    <AnimatePresence>
      {browse && (
        <motion.div
          data-testid="browse-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[250] bg-white overflow-y-auto"
        >
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[var(--line)]">
            <div className="max-w-[1500px] mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight">
                  {title}
                </h2>
                <div className="text-xs text-[var(--ink-muted)] num mt-1">
                  {d.product_grid.count_unit(list.length)}
                </div>
              </div>
              <button
                onClick={closeBrowse}
                aria-label={d.side_menu.close}
                className="p-2 hover:text-[var(--brand)] transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-w-[1500px] mx-auto px-5 md:px-8 py-10">
            {list.length === 0 ? (
              <div className="text-center py-24">
                <h3 className="font-serif text-2xl mb-2">{d.browse.empty_title}</h3>
                <p className="text-[var(--ink-muted)] text-sm">{d.browse.empty_sub}</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-5 gap-y-10 md:gap-y-14"
              >
                {list.map((p, i) => (
                  <ProductCard key={p.id} product={p} onQuickView={openQuickView} index={i} />
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
