"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { categoryTree, pickLocale, type CategoryKey } from "../_lib/products";
import { LOCALES, useLocale, type Locale } from "../_lib/i18n";
import { useProducts } from "../_lib/products-context";
import { useStorefrontUI } from "../_lib/storefront-ui";
import { useScrollLock } from "../_lib/scroll-lock";
import { BrandMark } from "./BrandMark";

const LOCALE_LABEL: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, setLocale, d } = useLocale();
  const { products } = useProducts();
  const { openQuickView, openBrowse } = useStorefrontUI();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<CategoryKey | null>(null);

  useScrollLock(open);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.ar.toLowerCase().includes(q) ||
          p.name.en.toLowerCase().includes(q) ||
          (p.name.fr ?? "").toLowerCase().includes(q) ||
          p.category.includes(q) ||
          p.subcategory.includes(q),
      )
      .slice(0, 5);
  }, [query, products]);

  const priceLocaleTag = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";

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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
          />
          <motion.aside
            initial={{ x: locale === "ar" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: locale === "ar" ? "-100%" : "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 w-[90vw] max-w-[400px] h-screen bg-white z-[201] overflow-y-auto overflow-x-hidden shadow-2xl"
            style={{ insetInlineStart: 0 }}
          >
            <div className="flex justify-between items-center px-5 py-5 border-b border-[var(--line)] sticky top-0 bg-white z-10">
              <BrandMark size="sm" />
              <button
                onClick={onClose}
                aria-label={d.side_menu.close}
                className="p-2 hover:text-[var(--brand)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-5 border-b border-[var(--line)]">
              <div className="bg-[var(--cream)] rounded-full px-5 py-3 flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--ink-muted)]">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={d.side_menu.search_placeholder}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--ink-faint)]"
                />
              </div>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  {results.map((p) => {
                    const name = pickLocale(p.name, locale);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setQuery("");
                          onClose();
                          openQuickView(p);
                        }}
                        className="w-full flex gap-3 items-center text-start hover:bg-[var(--cream)] p-2 rounded transition-colors"
                      >
                        <div className="relative w-14 h-[72px] bg-[var(--cream)] overflow-hidden flex-shrink-0">
                          <Image src={p.images[0]} alt={name} fill className="object-cover" sizes="56px" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{name}</div>
                          <div className="text-xs text-[var(--ink-muted)] num">
                            {p.price.toLocaleString(priceLocaleTag)} {d.product.currency}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>

            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--ink-muted)] flex-shrink-0" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
              <div className="flex-1 grid grid-cols-3 gap-1.5 font-sans-latin">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    aria-pressed={locale === l}
                    className={`py-2 text-[11px] tracking-[0.2em] uppercase rounded-md border transition-colors ${
                      locale === l
                        ? "bg-[var(--ink)] text-white border-[var(--ink)] font-semibold"
                        : "bg-white text-[var(--ink-muted)] border-[var(--line)] hover:border-[var(--ink)]"
                    }`}
                  >
                    {LOCALE_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>

            <nav className="py-3">
              <button
                onClick={() => {
                  onClose();
                  openBrowse({ type: "tag", key: "new" });
                }}
                className="w-full flex justify-between items-center px-5 py-3 text-sm font-medium tracking-wide text-[var(--ink)] hover:bg-[var(--cream)] transition-colors"
              >
                <span>{d.side_menu.new_this_week}</span>
                <span className="text-[var(--ink-faint)] rtl:rotate-180">›</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  openBrowse({ type: "tag", key: "sale" });
                }}
                className="w-full flex justify-between items-center px-5 py-3 text-sm font-medium tracking-wide text-[var(--ink)] hover:bg-[var(--cream)] transition-colors border-b border-[var(--line)] mb-2"
              >
                <span>{d.side_menu.sale_quick}</span>
                <span className="text-[var(--ink-faint)] rtl:rotate-180">›</span>
              </button>

              {categoryTree.map((cat, i) => {
                const isExpanded = expanded === cat.key;
                const hasSubs = cat.subcategories.length > 0;
                const catLabel = cat[locale] || cat.en;
                return (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.08 + i * 0.04 }}
                  >
                    <button
                      onClick={() => {
                        if (hasSubs) {
                          setExpanded(isExpanded ? null : cat.key);
                        } else {
                          onClose();
                          openBrowse({ type: "category", key: cat.key });
                        }
                      }}
                      className="w-full flex justify-between items-center px-5 py-3.5 text-[15px] font-medium tracking-wide hover:bg-[var(--cream)] transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg" aria-hidden>{cat.icon}</span>
                        <span>{catLabel}</span>
                      </span>
                      {hasSubs && (
                        <motion.span
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-[var(--ink-faint)] text-sm rtl:rotate-180"
                        >
                          ›
                        </motion.span>
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && hasSubs && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden bg-[var(--cream)]/40"
                        >
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub.key}
                              onClick={() => {
                                onClose();
                                openBrowse({ type: "subcategory", key: sub.key });
                              }}
                              className="w-full text-start ps-11 pe-5 py-2.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--brand)] hover:bg-white transition-colors"
                            >
                              {sub[locale] || sub.en}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </nav>

            <div className="px-5 py-6 border-t border-[var(--line)] mt-4 space-y-3 text-sm text-[var(--ink-muted)]">
              <div className="font-medium text-[var(--ink)] tracking-wider text-xs uppercase mb-3">
                {d.side_menu.contact_us}
              </div>
              <a href="https://api.whatsapp.com/send?phone=212700718587" className="block hover:text-[var(--brand)] transition-colors">
                {d.side_menu.whatsapp_label}
              </a>
              <a href="mailto:hello@rachel.com" className="block hover:text-[var(--brand)] transition-colors break-all">
                hello@rachel.com
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
