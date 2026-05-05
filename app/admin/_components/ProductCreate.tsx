"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createProductAction } from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";
import { ImageUploader } from "./ImageUploader";

type Sub = { key: string; ar: string; en: string; fr: string };
type Cat = {
  key: string;
  ar: string;
  en: string;
  fr: string;
  subcategories: Sub[];
};

export function ProductCreate({
  categories,
  dbReady = false,
}: {
  categories: Cat[];
  dbReady?: boolean;
}) {
  const { d, locale } = useAdminLocale();
  const { push } = useAdminToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [categoryKey, setCategoryKey] = useState(categories[0]?.key ?? "");
  const [images, setImages] = useState<string[]>([]);

  const subcategories = useMemo(
    () => categories.find((c) => c.key === categoryKey)?.subcategories ?? [],
    [categories, categoryKey],
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dbReady) return;
    const formData = new FormData(e.currentTarget);
    start(async () => {
      try {
        const result = await createProductAction(formData);
        push("Product created", "success");
        router.push(`/admin/products/${result.id}`);
      } catch (err) {
        push(err instanceof Error ? err.message : "Create failed", "error");
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="New product"
        subtitle="Create a new product. You'll add colors and images on the next step."
        actions={
          <>
            <Link
              href="/admin/products"
              className="px-4 py-2 text-sm font-medium text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] rounded-sm"
            >
              ← {d.product_detail.back}
            </Link>
            <button
              type="submit"
              disabled={!dbReady || pending}
              className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "…" : "Create product"}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

          <Section title={d.product_detail.identity}>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="id"
                label="ID"
                placeholder="e.g. c-tunic-04"
                hint="Lowercase letters, digits, hyphens. Used in URLs."
                required
                mono
              />
              <Field
                name="slug"
                label={d.product_detail.slug}
                placeholder="e.g. silk-tunic"
                hint="Lowercase letters, digits, hyphens."
                required
                mono
              />
            </div>
            <Field name="nameEn" label={d.product_detail.name_en} required />
            <Field name="nameAr" label={d.product_detail.name_ar} dir="rtl" required />
            <Field name="nameFr" label={d.product_detail.name_fr} placeholder="—" />
          </Section>

          <Section title={d.product_detail.description}>
            <Textarea name="descEn" label={d.product_detail.desc_en} required />
            <Textarea name="descAr" label={d.product_detail.desc_ar} dir="rtl" required />
            <Textarea name="descFr" label={d.product_detail.desc_fr} placeholder="—" />
          </Section>

          <Section title="Category">
            <div className="grid grid-cols-2 gap-4">
              <Select
                name="category"
                label="Category"
                value={categoryKey}
                onChange={setCategoryKey}
                options={categories.map((c) => ({
                  value: c.key,
                  label: c[locale] || c.en,
                }))}
              />
              <Select
                name="subcategory"
                label="Subcategory"
                options={subcategories.map((s) => ({
                  value: s.key,
                  label: s[locale] || s.en,
                }))}
              />
            </div>
          </Section>

          <Section title={d.product_detail.pricing}>
            <div className="grid grid-cols-3 gap-4">
              <Field
                name="price"
                label={d.product_detail.price}
                inputMode="numeric"
                required
                placeholder="0"
              />
              <Field
                name="compareAt"
                label={d.product_detail.compare_at}
                inputMode="numeric"
                placeholder="—"
              />
              <Field
                name="stock"
                label={d.product_detail.stock}
                inputMode="numeric"
                required
                placeholder="0"
              />
            </div>
            <Field
              name="sizes"
              label={d.product_detail.sizes}
              hint={d.product_detail.sizes_hint}
              placeholder="S, M, L"
            />
            <Field
              name="tags"
              label={d.product_detail.tags}
              hint={d.product_detail.tags_hint}
              placeholder="new, bestseller"
            />
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title={d.product_detail.images}>
            <ImageUploader name="images" value={images} onChange={setImages} />
          </Section>
          <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 text-sm text-[var(--a-ink-soft)]">
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium mb-3">
              Next steps
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[var(--a-ink-muted)]">
              <li>Fill in the required fields and click Create.</li>
              <li>You&apos;ll land on the product detail page.</li>
              <li>From there add colors and finalize copy.</li>
              <li>Set stock &gt; 0 to make it visible on the storefront.</li>
            </ol>
          </section>
        </aside>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  placeholder,
  hint,
  dir,
  mono,
  inputMode,
  required = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
  dir?: "ltr" | "rtl";
  mono?: boolean;
  inputMode?: "numeric" | "text";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
        {required && <span className="text-[var(--a-danger)] ms-1">*</span>}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        dir={dir}
        inputMode={inputMode}
        required={required}
        autoComplete="off"
        className={`mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm ${
          mono ? "font-mono" : ""
        }`}
      />
      {hint && <span className="text-[11px] text-[var(--a-ink-muted)] mt-1 block">{hint}</span>}
    </label>
  );
}

function Textarea({
  name,
  label,
  placeholder,
  dir,
  required = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
        {required && <span className="text-[var(--a-danger)] ms-1">*</span>}
      </span>
      <textarea
        name={name}
        placeholder={placeholder}
        dir={dir}
        required={required}
        rows={3}
        className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none resize-none rounded-sm"
      />
    </label>
  );
}

function Select({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        defaultValue={value === undefined ? options[0]?.value : undefined}
        className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] focus:border-[var(--a-ink)] outline-none rounded-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
