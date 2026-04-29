"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "../_lib/cart";
import { pickLocale } from "../_lib/products";
import { useLocale, type Dict, type Locale } from "../_lib/i18n";

const SHIPPING_FREE_AT = 500;

function whatsappMessage(
  lines: ReturnType<ReturnType<typeof useCart>["lineWithProduct"]>,
  subtotal: number,
  name: string,
  phone: string,
  city: string,
  d: Dict,
  locale: Locale,
) {
  const priceLocaleTag = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  const items = lines
    .map(
      ({ line, product }, i) =>
        `${i + 1}. ${pickLocale(product.name, locale)} — ${line.size} / ${line.color} — ×${line.qty} — ${(
          product.price * line.qty
        ).toLocaleString(priceLocaleTag)} ${d.product.currency}`,
    )
    .join("\n");
  return `${d.cart.whatsapp_intro}
${d.cart.whatsapp_confirm}

${items}

${d.cart.whatsapp_total}: ${subtotal.toLocaleString(priceLocaleTag)} ${d.product.currency}

${d.cart.whatsapp_name}: ${name}
${d.cart.whatsapp_phone}: ${phone}
${d.cart.whatsapp_city}: ${city}`;
}

export function CartDrawer() {
  const {
    isOpen,
    close,
    lineWithProduct,
    setQty,
    remove,
    subtotal,
    itemCount,
    clear,
  } = useCart();
  const { locale, d } = useLocale();
  const items = lineWithProduct();
  const [stage, setStage] = useState<"cart" | "checkout">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setStage("cart");
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  const needToFreeShip = Math.max(0, SHIPPING_FREE_AT - subtotal);
  const shipProgress = Math.min(1, subtotal / SHIPPING_FREE_AT);
  const canCheckout = name.trim() && phone.trim().length >= 8 && city.trim();
  const priceLocaleTag = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";

  const sendToWhatsApp = () => {
    const text = whatsappMessage(items, subtotal, name, phone, city, d, locale);
    const url = `https://wa.me/966500000000?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[400]"
          />
          <motion.aside
            initial={{ x: locale === "ar" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: locale === "ar" ? "-100%" : "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 w-[480px] max-w-full h-screen bg-white z-[401] overflow-y-auto shadow-2xl flex flex-col"
            style={{ insetInlineEnd: 0 }}
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)]">
              <div>
                <div className="font-serif text-2xl tracking-tight">
                  {stage === "cart" ? d.cart.title : d.cart.checkout_title}
                </div>
                <div className="text-xs text-[var(--ink-muted)] num">
                  {d.cart.count_unit(itemCount)}
                </div>
              </div>
              <button
                onClick={close}
                aria-label={d.cart.close}
                className="p-2 hover:text-[var(--brand)] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--cream)] flex items-center justify-center mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-[var(--ink)]">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinejoin="round" />
                    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-serif text-2xl mb-2">{d.cart.empty_title}</h3>
                <p className="text-[var(--ink-muted)] text-sm mb-6">{d.cart.empty_sub}</p>
                <button
                  onClick={close}
                  className="bg-[var(--ink)] text-white px-8 py-3 text-xs tracking-[0.3em] uppercase hover:bg-[var(--ink-soft)] transition-colors"
                >
                  {d.cart.empty_cta}
                </button>
              </div>
            ) : stage === "cart" ? (
              <>
                {subtotal < SHIPPING_FREE_AT && (
                  <div className="px-6 py-4 bg-[var(--cream)] border-b border-[var(--line)]">
                    <div className="text-xs mb-2 num">{d.cart.ship_progress(needToFreeShip)}</div>
                    <div className="h-1 bg-white rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--ink)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${shipProgress * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
                {subtotal >= SHIPPING_FREE_AT && (
                  <div className="px-6 py-3 bg-[#e9f5ec] border-b border-[var(--line)] text-xs text-[#1e5a2e] font-medium">
                    {d.cart.ship_unlocked}
                  </div>
                )}

                <div className="flex-1 px-6 py-4 space-y-5">
                  {items.map(({ line, product }) => {
                    const name = pickLocale(product.name, locale);
                    return (
                      <motion.div
                        key={`${line.productId}-${line.size}-${line.color}`}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4"
                      >
                        <div className="relative w-[90px] h-[120px] bg-[var(--cream)] flex-shrink-0 overflow-hidden">
                          <Image src={product.images[0]} alt={name} fill className="object-cover" sizes="90px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium mb-1 leading-snug">{name}</h4>
                          <div className="text-xs text-[var(--ink-muted)] mb-3">
                            {line.color} · {d.cart.size_prefix} {line.size}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex border border-[var(--line)]">
                              <button
                                onClick={() => setQty(line.productId, line.size, line.color, line.qty - 1)}
                                className="w-7 h-7 hover:bg-[var(--cream)] transition-colors"
                                aria-label={d.cart.qty_minus}
                              >
                                −
                              </button>
                              <div className="w-8 h-7 flex items-center justify-center text-sm num">
                                {line.qty}
                              </div>
                              <button
                                onClick={() => setQty(line.productId, line.size, line.color, line.qty + 1)}
                                className="w-7 h-7 hover:bg-[var(--cream)] transition-colors"
                                aria-label={d.cart.qty_plus}
                              >
                                +
                              </button>
                            </div>
                            <div className="text-sm font-semibold num">
                              {(product.price * line.qty).toLocaleString(priceLocaleTag)} {d.product.currency}
                            </div>
                          </div>
                          <button
                            onClick={() => remove(line.productId, line.size, line.color)}
                            className="mt-2 text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] underline"
                          >
                            {d.cart.remove}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <footer className="border-t border-[var(--line)] p-6 bg-white sticky bottom-0">
                  <div className="flex justify-between text-sm mb-2 num">
                    <span className="text-[var(--ink-muted)]">{d.cart.subtotal}</span>
                    <span>{subtotal.toLocaleString(priceLocaleTag)} {d.product.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-4 num">
                    <span className="text-[var(--ink-muted)]">{d.cart.shipping}</span>
                    <span className="text-[var(--ink)]">
                      {subtotal >= SHIPPING_FREE_AT ? d.cart.free : d.cart.ship_pending}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pb-4 border-b border-[var(--line)] mb-4 num">
                    <span>{d.cart.total}</span>
                    <span>{subtotal.toLocaleString(priceLocaleTag)} {d.product.currency}</span>
                  </div>
                  <button
                    onClick={() => setStage("checkout")}
                    className="w-full bg-[var(--ink)] text-white py-4 text-sm tracking-[0.3em] uppercase hover:bg-[var(--ink-soft)] transition-colors"
                  >
                    {d.cart.checkout}
                  </button>
                  <button
                    onClick={clear}
                    className="w-full mt-2 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] underline py-2"
                  >
                    {d.cart.empty_cart}
                  </button>
                </footer>
              </>
            ) : (
              <>
                <div className="flex-1 px-6 py-6 space-y-5">
                  <button
                    onClick={() => setStage("cart")}
                    className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] flex items-center gap-1 mb-2"
                  >
                    <span>{locale === "ar" ? "←" : "→"}</span> {d.cart.back_to_cart}
                  </button>
                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[var(--ink-muted)] mb-2 font-medium">
                      {d.cart.label_name}
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
                      placeholder={d.cart.placeholder_name}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[var(--ink-muted)] mb-2 font-medium">
                      {d.cart.label_phone}
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)] num"
                      placeholder={d.cart.placeholder_phone}
                      dir="ltr"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.25em] uppercase text-[var(--ink-muted)] mb-2 font-medium">
                      {d.cart.label_city}
                    </label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
                      placeholder={d.cart.placeholder_city}
                    />
                  </div>

                  <div className="bg-[var(--cream)] p-4 border border-[var(--line)] flex items-start gap-3 text-xs">
                    <svg width="22" height="22" viewBox="0 0 32 32" fill="#25D366" className="flex-shrink-0 mt-0.5">
                      <path d="M16 2C8.3 2 2 8.3 2 16c0 2.5.7 4.9 1.9 7L2 30l7.2-1.9c2 1.1 4.4 1.8 6.8 1.8 7.7 0 14-6.3 14-14S23.7 2 16 2zm8.1 19.9c-.3 1-2 1.9-2.8 2-.7.1-1.6.1-2.6-.2-.6-.2-1.4-.5-2.4-.9-4.2-1.8-7-6-7.2-6.3-.2-.3-1.7-2.2-1.7-4.3 0-2 1-3 1.4-3.4.4-.4.8-.5 1.1-.5h.8c.2 0 .6 0 .9.7.3.8 1 2.9 1.1 3.1.1.2.1.4 0 .7-.1.2-.2.4-.4.6-.2.2-.4.5-.5.7-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.5 1.3 2.7 1.7 3.1 1.9.4.2.6.2.8-.1.2-.3.9-1 1.1-1.4.2-.4.4-.3.8-.2.3.1 2.2 1 2.6 1.2.4.2.6.3.7.4.2.3.2 1.1-.1 2.1z"/>
                    </svg>
                    <div>
                      <div className="font-semibold text-[var(--ink)] mb-1">{d.cart.whatsapp_card_title}</div>
                      <div className="text-[var(--ink-muted)] leading-relaxed">
                        {d.cart.whatsapp_card_body}
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="border-t border-[var(--line)] p-6 bg-white">
                  <div className="flex justify-between font-semibold text-lg mb-4 num">
                    <span>{d.cart.total}</span>
                    <span>{subtotal.toLocaleString(priceLocaleTag)} {d.product.currency}</span>
                  </div>
                  <button
                    onClick={sendToWhatsApp}
                    disabled={!canCheckout}
                    className="w-full bg-[#25D366] text-white py-4 text-sm font-semibold tracking-wider uppercase hover:bg-[#1FB855] transition-colors flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 2C8.3 2 2 8.3 2 16c0 2.5.7 4.9 1.9 7L2 30l7.2-1.9c2 1.1 4.4 1.8 6.8 1.8 7.7 0 14-6.3 14-14S23.7 2 16 2zm8.1 19.9c-.3 1-2 1.9-2.8 2-.7.1-1.6.1-2.6-.2-.6-.2-1.4-.5-2.4-.9-4.2-1.8-7-6-7.2-6.3-.2-.3-1.7-2.2-1.7-4.3 0-2 1-3 1.4-3.4.4-.4.8-.5 1.1-.5h.8c.2 0 .6 0 .9.7.3.8 1 2.9 1.1 3.1.1.2.1.4 0 .7-.1.2-.2.4-.4.6-.2.2-.4.5-.5.7-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.5 1.3 2.7 1.7 3.1 1.9.4.2.6.2.8-.1.2-.3.9-1 1.1-1.4.2-.4.4-.3.8-.2.3.1 2.2 1 2.6 1.2.4.2.6.3.7.4.2.3.2 1.1-.1 2.1z"/>
                    </svg>
                    {d.cart.send_via_whatsapp}
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
