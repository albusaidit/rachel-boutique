"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "../_lib/cart";
import { useToast } from "./Toast";
import { colorLabel, pickLocale, type Product } from "../_lib/products";
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
  editable = false,
}: {
  product: Product;
  onQuickView: (p: Product) => void;
  index?: number;
  editable?: boolean;
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
      color: product.colors[0]?.name ?? "",
      qty: 1,
    });
    push(d.product.added_to_cart(name));
    setTimeout(open, 200);
  };

  const editHref = `/admin/products/${product.id}`;
  const onCardClick = (e: React.MouseEvent) => {
    if (editable) {
      e.preventDefault();
      e.stopPropagation();
      // Escape the preview iframe so the admin loads in the top window
      if (typeof window !== "undefined" && window.top) {
        window.top.location.href = editHref;
      } else {
        window.location.href = editHref;
      }
      return;
    }
    onQuickView(product);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onCardClick}
      className={`group cursor-pointer ${editable ? "ring-2 ring-transparent hover:ring-[#7A1632] hover:ring-offset-2 rounded-sm transition-all" : ""}`}
      title={editable ? `Edit ${name}` : undefined}
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

        {editable && (
          <div
            className="absolute top-3 z-10 bg-[#7A1632] text-white px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase font-semibold flex items-center gap-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ insetInlineEnd: "0.75rem" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
            Edit
          </div>
        )}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="bg-black/80 text-white px-6 py-2 text-xs tracking-[0.3em] uppercase">
              {d.product.sold_out}
            </div>
          </div>
        )}

        {!soldOut && !editable && (
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
                title={colorLabel(c.name, locale)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
