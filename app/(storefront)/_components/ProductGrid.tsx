"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { products, type Product } from "../_lib/products";
import { useLocale } from "../_lib/i18n";
import { ProductCard } from "./ProductCard";
import { QuickView } from "./QuickView";

type SortKey = "featured" | "new" | "priceLow" | "priceHigh";
type FilterKey = "all" | "new" | "sale" | "bestseller";
export type SectionKey = "new" | "bestsellers" | "perfumes" | "beauty";

export function ProductGrid({
  section,
  title,
  subtitle,
  ids,
}: {
  section?: SectionKey;
  title?: string;
  subtitle?: string;
  ids?: string[];
}) {
  const { d } = useLocale();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const sectionTitles = {
    new: { t: d.sections.new_title, s: d.sections.new_sub },
    bestsellers: { t: d.sections.bestsellers_title, s: d.sections.bestsellers_sub },
    perfumes: { t: d.sections.perfumes_title, s: d.sections.perfumes_sub },
    beauty: { t: d.sections.beauty_title, s: d.sections.beauty_sub },
  };
  const resolvedTitle = section ? sectionTitles[section].t : title ?? "";
  const resolvedSubtitle = section ? sectionTitles[section].s : subtitle;

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: d.product_grid.filter_all },
    { key: "new", label: d.product_grid.filter_new },
    { key: "bestseller", label: d.product_grid.filter_bestseller },
    { key: "sale", label: d.product_grid.filter_sale },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: "featured", label: d.product_grid.sort_featured },
    { key: "new", label: d.product_grid.sort_new },
    { key: "priceLow", label: d.product_grid.sort_price_low },
    { key: "priceHigh", label: d.product_grid.sort_price_high },
  ];

  const scoped = ids ? products.filter((p) => ids.includes(p.id)) : products;
  const filtered = scoped.filter((p) => filter === "all" || p.tags.includes(filter));
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priceLow") return a.price - b.price;
    if (sort === "priceHigh") return b.price - a.price;
    if (sort === "new") return Number(b.tags.includes("new")) - Number(a.tags.includes("new"));
    return 0;
  });

  return (
    <section className="max-w-[1500px] mx-auto px-5 md:px-8 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h2 className="font-serif text-4xl md:text-5xl font-light tracking-tight mb-3">
          {resolvedTitle}
        </h2>
        {resolvedSubtitle && (
          <p className="text-[var(--ink-muted)] max-w-md mx-auto text-sm md:text-base">
            {resolvedSubtitle}
          </p>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5 mb-8">
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all ${
                filter === f.key
                  ? "text-[var(--ink)] border-b-2 border-[var(--ink)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)] border-b-2 border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--ink-muted)] num">
            {d.product_grid.count_unit(sorted.length)}
          </span>
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 tracking-[0.15em] uppercase hover:text-[var(--brand)] transition-colors"
            >
              {d.product_grid.sort_label} {sorts.find((s) => s.key === sort)?.label}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 bg-white shadow-xl border border-[var(--line)] min-w-[200px] z-20"
                style={{ insetInlineEnd: 0 }}
              >
                {sorts.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSort(s.key);
                      setSortOpen(false);
                    }}
                    className={`w-full text-start px-4 py-3 text-xs hover:bg-[var(--cream)] transition-colors ${
                      sort === s.key ? "text-[var(--ink)] font-medium" : ""
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-5 gap-y-10 md:gap-y-14">
        {sorted.map((p, i) => (
          <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} index={i} />
        ))}
      </div>

      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </section>
  );
}
