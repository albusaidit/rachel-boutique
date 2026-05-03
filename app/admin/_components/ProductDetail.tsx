"use client";

import Link from "next/link";
import Image from "next/image";
import { useAdminLocale } from "../_lib/i18n-admin";
import { DemoBanner, PageHeader } from "./PageHeader";

type Product = {
  id: string;
  slug: string;
  name: { ar: string; en: string; fr?: string };
  description: { ar: string; en: string; fr?: string };
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  tags: string[];
};

type Cat = { key: string; ar: string; en: string; fr: string };

export function ProductDetail({
  product,
  categories,
}: {
  product: Product;
  categories: Cat[];
}) {
  const { d, locale } = useAdminLocale();
  const catLabel =
    categories.find((c) => c.key === product.category)?.[locale] ||
    categories.find((c) => c.key === product.category)?.en ||
    product.category;
  const productName = product.name[locale] || product.name.en;

  return (
    <>
      <PageHeader
        title={productName}
        subtitle={`${product.id} · ${catLabel}`}
        actions={
          <>
            <Link
              href="/admin/products"
              className="px-4 py-2 text-xs tracking-[0.2em] uppercase font-medium text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
            >
              ← {d.product_detail.back}
            </Link>
            <button
              disabled
              title={d.common.coming_soon}
              className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {d.product_detail.save}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <DemoBanner>{d.common.demo_banner}</DemoBanner>

          <Section title={d.product_detail.identity}>
            <Field label={d.product_detail.name_en} value={product.name.en} />
            <Field label={d.product_detail.name_ar} value={product.name.ar} dir="rtl" />
            <Field label={d.product_detail.name_fr} value={product.name.fr ?? ""} placeholder="—" />
            <Field label={d.product_detail.slug} value={product.slug} mono />
          </Section>

          <Section title={d.product_detail.description}>
            <Textarea label={d.product_detail.desc_en} value={product.description.en} />
            <Textarea
              label={d.product_detail.desc_ar}
              value={product.description.ar}
              dir="rtl"
            />
            <Textarea
              label={d.product_detail.desc_fr}
              value={product.description.fr ?? ""}
              placeholder="—"
            />
          </Section>

          <Section title={d.product_detail.pricing}>
            <div className="grid grid-cols-3 gap-4">
              <Field label={d.product_detail.price} value={String(product.price)} />
              <Field
                label={d.product_detail.compare_at}
                value={product.compareAt ? String(product.compareAt) : ""}
                placeholder="—"
              />
              <Field label={d.product_detail.stock} value={String(product.stock)} />
            </div>
            <Field
              label={d.product_detail.sizes}
              value={product.sizes.join(", ")}
              hint={d.product_detail.sizes_hint}
            />
            <Field
              label={d.product_detail.tags}
              value={product.tags.join(", ")}
              hint={d.product_detail.tags_hint}
            />
          </Section>

          <Section title={d.product_detail.colors}>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2 border border-[var(--a-line)] px-3 py-2 text-xs"
                >
                  <span
                    className="w-4 h-4 rounded-full ring-1 ring-[var(--a-line)]"
                    style={{ background: c.hex }}
                  />
                  <span>{c.name}</span>
                  <span className="text-[var(--a-ink-faint)] font-mono">{c.hex}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title={d.product_detail.images}>
            <div className="grid grid-cols-2 gap-2">
              {product.images.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] bg-[var(--a-line-soft)] overflow-hidden rounded-sm"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 200px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </Section>
          <Section title={d.product_detail.storefront}>
            <Link
              href={`/#${product.id}`}
              target="_blank"
              className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] underline"
            >
              {d.product_detail.storefront_link}
            </Link>
          </Section>
        </aside>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
      <div className="px-5 py-3 border-b border-[var(--a-line)] text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {title}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  placeholder,
  hint,
  dir,
  mono,
}: {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  dir?: "ltr" | "rtl";
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <input
        defaultValue={value}
        placeholder={placeholder}
        dir={dir}
        disabled
        className={`mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-line-soft)]/40 disabled:cursor-not-allowed ${
          mono ? "font-mono" : ""
        }`}
      />
      {hint && (
        <span className="text-[11px] text-[var(--a-ink-muted)] mt-1 block">{hint}</span>
      )}
    </label>
  );
}

function Textarea({
  label,
  value,
  placeholder,
  dir,
}: {
  label: string;
  value: string;
  placeholder?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <textarea
        defaultValue={value}
        placeholder={placeholder}
        dir={dir}
        disabled
        rows={3}
        className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-line-soft)]/40 disabled:cursor-not-allowed resize-none"
      />
    </label>
  );
}
