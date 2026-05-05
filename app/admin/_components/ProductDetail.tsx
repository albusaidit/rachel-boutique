"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateProductAction } from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";
import { ImageUploader } from "./ImageUploader";

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
  dbReady = false,
}: {
  product: Product;
  categories: Cat[];
  dbReady?: boolean;
}) {
  const { d, locale } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [images, setImages] = useState<string[]>(product.images);
  const catLabel =
    categories.find((c) => c.key === product.category)?.[locale] ||
    categories.find((c) => c.key === product.category)?.en ||
    product.category;
  const productName = product.name[locale] || product.name.en;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dbReady) return;
    const formData = new FormData(e.currentTarget);
    start(async () => {
      try {
        await updateProductAction(product.id, formData);
        push("Saved", "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
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
              type="submit"
              disabled={!dbReady || pending}
              title={!dbReady ? d.common.coming_soon : undefined}
              className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "…" : d.product_detail.save}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

          <Section title={d.product_detail.identity}>
            <Field name="nameEn" label={d.product_detail.name_en} value={product.name.en} editable={dbReady} />
            <Field name="nameAr" label={d.product_detail.name_ar} value={product.name.ar} dir="rtl" editable={dbReady} />
            <Field name="nameFr" label={d.product_detail.name_fr} value={product.name.fr ?? ""} placeholder="—" editable={dbReady} />
            <Field label={d.product_detail.slug} value={product.slug} mono editable={false} />
          </Section>

          <Section title={d.product_detail.description}>
            <Textarea name="descEn" label={d.product_detail.desc_en} value={product.description.en} editable={dbReady} />
            <Textarea name="descAr" label={d.product_detail.desc_ar} value={product.description.ar} dir="rtl" editable={dbReady} />
            <Textarea name="descFr" label={d.product_detail.desc_fr} value={product.description.fr ?? ""} placeholder="—" editable={dbReady} />
          </Section>

          <Section title={d.product_detail.pricing}>
            <div className="grid grid-cols-3 gap-4">
              <Field name="price" label={d.product_detail.price} value={String(product.price)} editable={dbReady} inputMode="numeric" />
              <Field
                name="compareAt"
                label={d.product_detail.compare_at}
                value={product.compareAt ? String(product.compareAt) : ""}
                placeholder="—"
                editable={dbReady}
                inputMode="numeric"
              />
              <Field name="stock" label={d.product_detail.stock} value={String(product.stock)} editable={dbReady} inputMode="numeric" />
            </div>
            <Field
              name="sizes"
              label={d.product_detail.sizes}
              value={product.sizes.join(", ")}
              hint={d.product_detail.sizes_hint}
              editable={dbReady}
            />
            <Field
              name="tags"
              label={d.product_detail.tags}
              value={product.tags.join(", ")}
              hint={d.product_detail.tags_hint}
              editable={dbReady}
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
            <ImageUploader name="images" value={images} onChange={setImages} />
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
    </form>
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
  name,
  label,
  value,
  placeholder,
  hint,
  dir,
  mono,
  inputMode,
  editable = false,
}: {
  name?: string;
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  dir?: "ltr" | "rtl";
  mono?: boolean;
  inputMode?: "numeric" | "text" | "email" | "tel" | "url" | "search";
  editable?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <input
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        dir={dir}
        inputMode={inputMode}
        disabled={!editable}
        className={`mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm focus:border-[var(--a-ink)] outline-none ${
          editable ? "bg-[var(--a-surface)]" : "bg-[var(--a-line-soft)]/40 disabled:cursor-not-allowed"
        } ${mono ? "font-mono" : ""}`}
      />
      {hint && (
        <span className="text-[11px] text-[var(--a-ink-muted)] mt-1 block">{hint}</span>
      )}
    </label>
  );
}

function Textarea({
  name,
  label,
  value,
  placeholder,
  dir,
  editable = false,
}: {
  name?: string;
  label: string;
  value: string;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  editable?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        dir={dir}
        disabled={!editable}
        rows={3}
        className={`mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm focus:border-[var(--a-ink)] outline-none resize-none ${
          editable ? "bg-[var(--a-surface)]" : "bg-[var(--a-line-soft)]/40 disabled:cursor-not-allowed"
        }`}
      />
    </label>
  );
}
