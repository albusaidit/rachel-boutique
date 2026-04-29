"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "../_lib/cart";
import { useToast } from "./Toast";
import { pickLocale, type Product } from "../_lib/products";
import { useLocale } from "../_lib/i18n";

const badgeStyles: Record<string, string> = {
  new: "bg-[var(--ink)] text-white",
  sale: "bg-[var(--ink)] text-white",
  bestseller: "bg-white text-[var(--ink)] border border-[var(--line)]",
  limited: "bg-[var(--warm)] text-[var(--ink)]",
};

export function ProductCard({
  product,
  onQuickView,
  index = 0,
}: {
  product: Product;
  onQuickView: (p: Product) => void;
  index?: number;
}) {
  const { add, open } = useCart();
  const { push } = useToast();
  const { locale, d } = useLocale();
  const [hovered, setHovered] = useState(false);

  const name = pickLocale(product.name, locale);
  const hasSecondImage = product.images.length > 1;
  const onSale = typeof product.compareAt === "number";
  const discount = onSale
    ? Math.round(((product.compareAt! - product.price) / product.compareAt!) * 100)
    : 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const soldOut = product.stock === 0;
  const primaryBadge = product.tags[0];

  const badgeText: Record<string, string> = {
    new: d.product.badge_new,
    sale: d.product.badge_sale,
    bestseller: d.product.badge_bestseller,
    limited: d.product.badge_limited,
  };

  const priceLocaleTag = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (soldOut) return;
    add({
      productId: product.id,
      size: product.sizes[0],
      color: product.colors[0].name,
      qty: 1,
    });
    push(d.product.added_to_cart(name));
    setTimeout(open, 200);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onQuickView(product)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--cream)] mb-3">
        <Image
          src={product.images[0]}
          alt={name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-all duration-700 ${
            hovered && hasSecondImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
          } ${soldOut ? "grayscale" : ""}`}
        />
        {hasSecondImage && (
          <Image
            src={product.images[1]}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-all duration-700 ${
              hovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          />
        )}

        {primaryBadge && !soldOut && (
          <div
            className={`absolute top-3 px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase font-medium ${badgeStyles[primaryBadge]}`}
            style={{ insetInlineStart: "0.75rem" }}
          >
            {badgeText[primaryBadge]}
            {primaryBadge === "sale" && onSale && ` −${discount}%`}
          </div>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-black/80 text-white px-6 py-2 text-xs tracking-[0.3em] uppercase">
              {d.product.sold_out}
            </div>
          </div>
        )}

        {!soldOut && (
          <motion.button
            onClick={quickAdd}
            initial={false}
            animate={{ y: hovered ? 0 : "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm py-3.5 text-xs tracking-[0.3em] uppercase font-medium hover:bg-[var(--ink)] hover:text-white transition-colors hidden md:flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinejoin="round" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
            </svg>
            {d.product.quick_add}
          </motion.button>
        )}
      </div>

      <div className="px-1">
        <h3 className="text-[13px] font-medium tracking-wide mb-1.5 leading-snug min-h-[36px]">
          {name}
        </h3>
        <div className="flex items-center gap-2.5 num">
          <span className={`text-sm font-semibold ${onSale ? "text-[var(--ink)]" : ""}`}>
            {product.price.toLocaleString(priceLocaleTag)} {d.product.currency}
          </span>
          {onSale && (
            <span className="text-xs text-[var(--ink-faint)] line-through">
              {product.compareAt!.toLocaleString(priceLocaleTag)}
            </span>
          )}
        </div>
        {lowStock && !soldOut && (
          <div className="mt-1.5 text-[11px] text-[var(--ink-soft)] tracking-wide num">
            {d.product.only_n_left(product.stock)}
          </div>
        )}
        {product.colors.length > 1 && (
          <div className="mt-2 flex gap-1.5">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                className="w-3 h-3 rounded-full ring-1 ring-[var(--line)]"
                style={{ background: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
