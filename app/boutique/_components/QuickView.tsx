"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "../_lib/cart";
import { useToast } from "./Toast";
import { pickLocale, subcategoryLabel, type Product } from "../_lib/products";
import { useLocale } from "../_lib/i18n";

export function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { add, open } = useCart();
  const { push } = useToast();
  const { locale, d } = useLocale();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);

  useEffect(() => {
    if (product) {
      setSize(null);
      setColor(product.colors[0].name);
      setImageIdx(0);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [product]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [product, onClose]);

  const productName = product ? pickLocale(product.name, locale) : "";
  const productDesc = product ? pickLocale(product.description, locale) : "";
  const priceLocaleTag = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";

  const addToCart = () => {
    if (!product) return;
    if (!size) {
      push(d.quick_view.pick_size_first, "error");
      return;
    }
    add({ productId: product.id, size, color: color ?? product.colors[0].name, qty: 1 });
    push(d.product.added_to_cart(productName));
    onClose();
    setTimeout(open, 300);
  };

  const onSale = product && typeof product.compareAt === "number";

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-[301] md:p-6 pointer-events-none"
          >
            <div className="pointer-events-auto bg-white w-full md:max-w-5xl max-h-[92vh] overflow-y-auto relative shadow-2xl">
              <button
                onClick={onClose}
                aria-label={d.quick_view.close}
                className="absolute top-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md"
                style={{ insetInlineStart: "1rem" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="relative bg-[var(--cream)] aspect-[3/4] md:aspect-auto md:min-h-[600px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={imageIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={product.images[imageIdx]}
                        alt={productName}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                  {product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {product.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageIdx(idx)}
                          className="h-[3px] bg-white/60 hover:bg-white transition-all"
                          style={{
                            width: idx === imageIdx ? 32 : 16,
                            background: idx === imageIdx ? "white" : "rgba(255,255,255,0.6)",
                          }}
                          aria-label={d.quick_view.image_n(idx + 1)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-10">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--ink-muted)] mb-2">
                    {product.tags.includes("new") && `${d.quick_view.new_tag} · `}
                    {product.tags.includes("limited") && `${d.quick_view.limited_edition} · `}
                    {subcategoryLabel(product.subcategory, locale)}
                  </div>
                  <h2 className="font-serif text-3xl md:text-[38px] font-light leading-tight mb-4 tracking-tight">
                    {productName}
                  </h2>
                  <div className="flex items-center gap-3 pb-5 mb-6 border-b border-[var(--line)] num">
                    <span className={`text-2xl font-semibold ${onSale ? "text-[var(--ink)]" : ""}`}>
                      {product.price.toLocaleString(priceLocaleTag)} {d.product.currency}
                    </span>
                    {onSale && (
                      <span className="text-base text-[var(--ink-faint)] line-through">
                        {product.compareAt!.toLocaleString(priceLocaleTag)}
                      </span>
                    )}
                  </div>

                  <p className="text-[var(--ink-soft)] leading-relaxed mb-6 text-[15px]">
                    {productDesc}
                  </p>

                  {product.colors.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[11px] tracking-[0.25em] uppercase text-[var(--ink-muted)] mb-3 font-medium">
                        {d.quick_view.color}: <span className="text-[var(--ink)]">{color}</span>
                      </div>
                      <div className="flex gap-3">
                        {product.colors.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => setColor(c.name)}
                            aria-label={c.name}
                            className={`w-9 h-9 rounded-full ring-2 ring-offset-2 transition-all ${
                              color === c.name
                                ? "ring-[var(--ink)]"
                                : "ring-transparent hover:ring-[var(--line)]"
                            }`}
                            style={{ background: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] tracking-[0.25em] uppercase text-[var(--ink-muted)] font-medium">
                        {d.quick_view.size}
                      </div>
                      <button className="text-[11px] text-[var(--ink-muted)] underline hover:text-[var(--ink)]">
                        {d.quick_view.size_guide}
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`min-w-[52px] h-[52px] px-4 text-sm border transition-all ${
                            size === s
                              ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                              : "bg-white text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {product.stock > 0 && product.stock <= 5 && (
                    <div className="text-xs text-[var(--ink-soft)] tracking-wide mb-4 flex items-center gap-2 num">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)] animate-pulse" />
                      {d.quick_view.limited_left(product.stock)}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <motion.button
                      onClick={addToCart}
                      whileTap={{ scale: 0.98 }}
                      disabled={product.stock === 0}
                      className="bg-[var(--ink)] text-white py-4 text-sm tracking-[0.3em] uppercase font-medium hover:bg-[var(--ink-soft)] transition-colors disabled:opacity-40"
                    >
                      {product.stock === 0 ? d.product.sold_out : d.quick_view.add_to_cart}
                    </motion.button>
                    <button
                      aria-label={d.quick_view.add_to_wishlist}
                      className="border border-[var(--line)] w-14 h-14 flex items-center justify-center hover:border-[var(--ink)] transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[var(--line)] space-y-2 text-xs text-[var(--ink-muted)]">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h11l4 5v5h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3V7z" strokeLinejoin="round" /></svg>
                      {d.quick_view.free_shipping_over}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {d.quick_view.free_returns_14d}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
