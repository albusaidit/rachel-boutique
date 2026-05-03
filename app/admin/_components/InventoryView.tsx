"use client";

import Link from "next/link";
import Image from "next/image";
import { useAdminLocale } from "../_lib/i18n-admin";
import { DemoBanner, PageHeader } from "./PageHeader";

type Row = {
  id: string;
  name: { ar: string; en: string; fr?: string };
  image: string;
  category: string;
  price: number;
  stock: number;
  sizes: string[];
};

type Cat = { key: string; ar: string; en: string; fr: string };

function Card({
  title,
  count,
  tone,
}: {
  title: string;
  count: number;
  tone: "danger" | "warning" | "success";
}) {
  const map = {
    danger: "var(--a-danger)",
    warning: "var(--a-warning)",
    success: "var(--a-success)",
  } as const;
  return (
    <div className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5">
      <div
        className="text-[11px] tracking-[0.2em] uppercase font-medium"
        style={{ color: map[tone] }}
      >
        {title}
      </div>
      <div className="text-3xl font-semibold mt-2 num">{count}</div>
    </div>
  );
}

export function InventoryView({ rows, categories }: { rows: Row[]; categories: Cat[] }) {
  const { d, locale } = useAdminLocale();
  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  const catLabels = Object.fromEntries(categories.map((c) => [c.key, c[locale] || c.en]));

  const totalUnits = rows.reduce((s, r) => s + r.stock, 0);
  const avg = rows.length === 0 ? 0 : Math.round(totalUnits / rows.length);
  const out = rows.filter((r) => r.stock === 0);
  const low = rows.filter((r) => r.stock > 0 && r.stock <= 5);

  const pickName = (n: { ar: string; en: string; fr?: string }) =>
    n[locale] || n.en || n.ar;

  const Section = ({
    title,
    items,
    emptyText,
    tone,
  }: {
    title: string;
    items: Row[];
    emptyText: string;
    tone: "danger" | "warning";
  }) => {
    const cls = tone === "danger" ? "var(--a-danger)" : "var(--a-warning)";
    return (
      <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
        <div className="px-5 py-3 border-b border-[var(--a-line)] flex items-center gap-2">
          <span aria-hidden style={{ color: cls }}>●</span>
          <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
          <span className="text-xs text-[var(--a-ink-muted)] num ms-auto">
            {items.length}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--a-ink-muted)]">
            {emptyText}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-line-soft)]">
            {items.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="relative w-9 h-12 bg-[var(--a-line-soft)] overflow-hidden flex-shrink-0">
                  <Image src={r.image} alt="" fill sizes="36px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/products/${r.id}`}
                    className="text-sm font-medium truncate hover:text-[var(--a-ink)] block"
                  >
                    {pickName(r.name)}
                  </Link>
                  <div className="text-[11px] text-[var(--a-ink-muted)] truncate">
                    {catLabels[r.category]} · {r.sizes.join(", ")}
                  </div>
                </div>
                <div className="text-end num">
                  <div className="text-sm font-semibold" style={{ color: cls }}>
                    {r.stock}
                  </div>
                  <div className="text-[11px] text-[var(--a-ink-muted)]">
                    SAR {r.price.toLocaleString(numLocale)}
                  </div>
                </div>
                <button
                  disabled
                  title={d.common.coming_soon}
                  className="text-xs px-3 py-1.5 border border-[var(--a-line)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {d.inventory.restock}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader title={d.inventory.title} subtitle={d.inventory.subtitle} />
      <div className="px-8 py-6 space-y-6">
        <DemoBanner>{d.common.demo_banner}</DemoBanner>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card title={d.inventory.out} count={out.length} tone="danger" />
          <Card title={d.inventory.low} count={low.length} tone="warning" />
          <div className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5">
            <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
              {d.inventory.total_units}
            </div>
            <div className="text-3xl font-semibold mt-2 num">
              {totalUnits.toLocaleString(numLocale)}
            </div>
          </div>
          <div className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5">
            <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
              {d.inventory.avg_per_sku}
            </div>
            <div className="text-3xl font-semibold mt-2 num">{avg}</div>
          </div>
        </section>

        <Section
          title={d.inventory.out}
          items={out}
          emptyText={d.inventory.none_out}
          tone="danger"
        />
        <Section
          title={d.inventory.low}
          items={low}
          emptyText={d.inventory.none_low}
          tone="warning"
        />
      </div>
    </>
  );
}
