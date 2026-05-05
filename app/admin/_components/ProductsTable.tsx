"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  bulkArchiveProductsAction,
  bulkDeleteProductsAction,
} from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { Modal } from "./Modal";
import { DemoBanner, PageHeader } from "./PageHeader";

type Row = {
  id: string;
  slug: string;
  name: { ar: string; en: string; fr?: string };
  image: string;
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  tags: string[];
};

type Cat = { key: string; ar: string; en: string; fr: string };

type FilterKey = "all" | "new" | "sale" | "bestseller" | "limited" | "out";
type SortField = "name" | "category" | "price" | "stock";
type SortDir = "asc" | "desc";

function StockPill({
  stock,
  d,
}: {
  stock: number;
  d: ReturnType<typeof useAdminLocale>["d"];
}) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 bg-[var(--a-danger-bg)] text-[var(--a-danger)]">
        {d.products.stock_out}
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex items-center text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 bg-[var(--a-warning-bg)] text-[var(--a-warning)]">
        {d.products.stock_low}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 bg-[var(--a-success-bg)] text-[var(--a-success)]">
      {d.products.stock_in}
    </span>
  );
}

function exportCsv(rows: Row[], cats: Cat[], locale: "ar" | "en" | "fr") {
  const catLabels = Object.fromEntries(cats.map((c) => [c.key, c[locale] || c.en]));
  const header = ["ID", "Slug", "Name (EN)", "Name (AR)", "Name (FR)", "Category", "Price", "Compare at", "Stock", "Tags"];
  const lines = rows.map((p) =>
    [
      p.id,
      p.slug,
      p.name.en,
      p.name.ar,
      p.name.fr ?? "",
      catLabels[p.category] ?? p.category,
      p.price,
      p.compareAt ?? "",
      p.stock,
      p.tags.join("|"),
    ]
      .map((v) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rachel-products-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ProductsTable({
  rows,
  categories,
  dbReady = false,
}: {
  rows: Row[];
  categories: Cat[];
  dbReady?: boolean;
}) {
  const { d, locale } = useAdminLocale();
  const { push } = useAdminToast();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    if (params.get("export") === "1") {
      exportCsv(rows, categories, locale);
    }
  }, [params, rows, categories, locale]);

  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  const catLabels = Object.fromEntries(categories.map((c) => [c.key, c[locale] || c.en]));

  const pickName = (n: { ar: string; en: string; fr?: string }) =>
    n[locale] || n.en || n.ar;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = rows;
    if (categoryFilter !== "all") {
      r = r.filter((p) => p.category === categoryFilter);
    }
    if (filter === "out") {
      r = r.filter((p) => p.stock === 0);
    } else if (filter !== "all") {
      r = r.filter((p) => p.tags.includes(filter));
    }
    if (q) {
      r = r.filter(
        (p) =>
          p.name.ar.toLowerCase().includes(q) ||
          p.name.en.toLowerCase().includes(q) ||
          (p.name.fr ?? "").toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.includes(q),
      );
    }
    const sorted = [...r];
    const factor = sortDir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortField) {
        case "price":
          return (a.price - b.price) * factor;
        case "stock":
          return (a.stock - b.stock) * factor;
        case "category":
          return (catLabels[a.category] ?? a.category)
            .localeCompare(catLabels[b.category] ?? b.category) * factor;
        case "name":
        default:
          return pickName(a.name).localeCompare(pickName(b.name)) * factor;
      }
    });
    return sorted;
  }, [rows, query, filter, categoryFilter, sortField, sortDir, locale, catLabels]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = !allSelected && filtered.some((p) => selected.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach((p) => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((p) => next.add(p.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: d.products.filter_all },
    { key: "new", label: d.products.filter_new },
    { key: "sale", label: d.products.filter_sale },
    { key: "bestseller", label: d.products.filter_bestseller },
    { key: "limited", label: d.products.filter_limited },
    { key: "out", label: d.products.filter_out },
  ];

  return (
    <>
      <PageHeader
        title={d.products.title}
        subtitle={d.products.subtitle(rows.length)}
        actions={
          <>
            <button
              onClick={() => exportCsv(rows, categories, locale)}
              className="border border-[var(--a-line)] bg-[var(--a-surface)] px-4 py-2 text-xs tracking-[0.2em] uppercase font-medium text-[var(--a-ink-soft)] hover:border-[var(--a-ink-faint)] hover:text-[var(--a-ink)] transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15V3" strokeLinecap="round" />
              </svg>
              {d.products.export}
            </button>
            <Link
              href="/admin/products/new"
              className={`inline-flex items-center gap-2 bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2.5 text-sm font-semibold rounded-md shadow hover:opacity-90 transition-opacity ${
                dbReady ? "" : "opacity-40 pointer-events-none"
              }`}
              aria-disabled={!dbReady}
              title={!dbReady ? d.common.coming_soon : undefined}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              {d.products.new}
            </Link>
          </>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <div className="px-4 py-3 border-b border-[var(--a-line)] flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 h-9 bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--a-ink-muted)]">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={d.products.search_placeholder}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 border border-[var(--a-line)] bg-[var(--a-surface)] px-3 text-sm rounded"
              aria-label={d.products.col_category}
            >
              <option value="all">{d.products.col_category}: {d.products.filter_all}</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c[locale] || c.en}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 h-9 text-xs tracking-[0.18em] uppercase border transition-colors ${
                    filter === f.key
                      ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)] border-[var(--a-accent)]"
                      : "bg-[var(--a-surface)] border-[var(--a-line)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

          </div>

          {selected.size > 0 && (
            <div className="px-4 py-2 bg-[var(--a-info-bg)] border-b border-[var(--a-line)] flex items-center gap-3 text-sm">
              <span className="font-medium">{d.products.bulk_selected(selected.size)}</span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] underline"
              >
                {d.products.bulk_clear}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => {
                  const ids = Array.from(selected);
                  start(async () => {
                    try {
                      await bulkArchiveProductsAction(ids, true);
                      push(`Archived ${ids.length} product${ids.length === 1 ? "" : "s"}`, "success");
                      setSelected(new Set());
                    } catch (err) {
                      push(err instanceof Error ? err.message : "Archive failed", "error");
                    }
                  });
                }}
                disabled={!dbReady || pending}
                className="text-xs px-3 py-1.5 border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              >
                {d.products.bulk_archive}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={!dbReady || pending}
                className="text-xs px-3 py-1.5 border border-[var(--a-danger-line)] text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              >
                {d.products.bulk_delete}
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] sticky top-14 z-10">
                <tr>
                  <th className="px-4 py-3 w-10 text-start">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleAll}
                      className="accent-[var(--a-ink)]"
                    />
                  </th>
                  <th className="text-start font-medium px-4 py-3 w-14"></th>
                  <SortableTh field="name" label={d.products.col_product} sortField={sortField} sortDir={sortDir} onClick={onSortClick} />
                  <SortableTh field="category" label={d.products.col_category} sortField={sortField} sortDir={sortDir} onClick={onSortClick} />
                  <SortableTh field="price" label={d.products.col_price} sortField={sortField} sortDir={sortDir} onClick={onSortClick} align="end" />
                  <SortableTh field="stock" label={d.products.col_stock} sortField={sortField} sortDir={sortDir} onClick={onSortClick} align="end" />
                  <th className="text-start font-medium px-4 py-3 w-28">{d.products.col_status}</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-line-soft)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--a-ink-muted)]">
                      {d.products.none_match}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--a-line-soft)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                          className="accent-[var(--a-ink)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative w-10 h-12 bg-[var(--a-line-soft)] overflow-hidden rounded-sm">
                          <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[320px]">
                        <div className="font-medium truncate">{pickName(p.name)}</div>
                        <div className="text-xs text-[var(--a-ink-muted)] mt-0.5 truncate">
                          {p.id} · /{p.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--a-ink-soft)]">
                        {catLabels[p.category]}
                      </td>
                      <td className="px-4 py-3 text-end num">
                        <div className="font-medium">MAD {p.price.toLocaleString(numLocale)}</div>
                        {typeof p.compareAt === "number" && (
                          <div className="text-xs text-[var(--a-ink-faint)] line-through">
                            {p.compareAt.toLocaleString(numLocale)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end num">{p.stock}</td>
                      <td className="px-4 py-3">
                        <StockPill stock={p.stock} d={d} />
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] underline"
                        >
                          {d.products.view}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={d.products.bulk_delete}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--a-ink)]">
            Permanently delete {selected.size} product{selected.size === 1 ? "" : "s"}? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
            >
              {d.common.cancel}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const ids = Array.from(selected);
                start(async () => {
                  try {
                    await bulkDeleteProductsAction(ids);
                    push(`Deleted ${ids.length} product${ids.length === 1 ? "" : "s"}`, "success");
                    setSelected(new Set());
                    setConfirmDelete(false);
                  } catch (err) {
                    push(err instanceof Error ? err.message : "Delete failed", "error");
                  }
                });
              }}
              className="bg-[var(--a-danger)] text-white px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "…" : d.products.bulk_delete}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function SortableTh({
  field,
  label,
  sortField,
  sortDir,
  onClick,
  align = "start",
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onClick: (f: SortField) => void;
  align?: "start" | "end";
}) {
  const active = sortField === field;
  return (
    <th className={`text-${align} font-medium px-0 py-0`}>
      <button
        type="button"
        onClick={() => onClick(field)}
        className={`w-full px-4 py-3 flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors hover:text-[var(--a-ink)] ${
          align === "end" ? "justify-end" : "justify-start"
        } ${active ? "text-[var(--a-ink)]" : "text-[var(--a-ink-muted)]"}`}
      >
        <span>{label}</span>
        <span aria-hidden className="text-[8px] leading-none">
          {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}
