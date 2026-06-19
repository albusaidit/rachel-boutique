"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { useCart } from "../_lib/cart";
import { LOCALES, useLocale, type Locale } from "../_lib/i18n";
import { SideMenu } from "./SideMenu";
import { BrandMark } from "./BrandMark";

const LOCALE_LABEL: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };

export function Header() {
  const { itemCount, open } = useCart();
  const { locale, setLocale, d } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const shadow = useTransform(scrollY, [0, 80], ["0 0 0 rgba(0,0,0,0)", "0 1px 20px rgba(0,0,0,0.04)"]);
  const bg = useTransform(scrollY, [0, 80], ["rgba(250,250,250,0)", "rgba(255,255,255,0.85)"]);

  return (
    <>
      <motion.header
        style={{ boxShadow: shadow, backgroundColor: bg }}
        className="sticky top-0 z-50 backdrop-blur-md"
      >
        <div className="max-w-[1500px] mx-auto px-5 md:px-8 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label={d.nav.menu}
              className="p-1 -ms-1 text-[#1a1a1a] hover:text-[var(--brand)] transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="hidden md:flex items-center gap-2 text-sm text-[#1a1a1a] hover:text-[var(--brand)] transition-colors"
              aria-label={d.nav.search_label}
              onClick={() => setMenuOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <span>{d.nav.search}</span>
            </button>
          </div>

          <div className="text-center">
            <a href="#top" className="inline-block" aria-label="RACHÉL">
              {/* Wrapper spans carry the responsive hide/show — .wordmark sets
                  display:inline-block which would otherwise override `hidden`. */}
              <span className="md:hidden">
                <BrandMark size="sm" priority />
              </span>
              <span className="hidden md:block">
                <BrandMark size="md" priority />
              </span>
            </a>
          </div>

          <div className="flex items-center justify-end gap-3 md:gap-5">
            <div
              role="group"
              aria-label={d.nav.lang_label}
              className="hidden md:flex items-center text-[11px] tracking-[0.18em] font-medium font-sans-latin"
            >
              {LOCALES.map((l, i) => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  aria-pressed={locale === l}
                  className={`px-1.5 transition-colors ${
                    locale === l
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                  }`}
                >
                  {LOCALE_LABEL[l]}
                  {i < LOCALES.length - 1 && (
                    <span className="text-[var(--ink-faint)] ms-1.5 select-none">·</span>
                  )}
                </button>
              ))}
            </div>
            <button
              aria-label={d.nav.wishlist}
              className="p-1 text-[#1a1a1a] hover:text-[var(--brand)] transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={open}
              aria-label={d.nav.cart_count(itemCount)}
              className="relative p-1 text-[#1a1a1a] hover:text-[var(--brand)] transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinejoin="round" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
              </svg>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="num absolute -top-1 min-w-[18px] h-[18px] bg-[var(--ink)] text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1"
                  style={{ insetInlineEnd: "-4px" }}
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.header>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
