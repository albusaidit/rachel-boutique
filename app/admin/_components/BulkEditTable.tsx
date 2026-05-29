"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  bulkUpdateProductsAction,
  type ProductPatch,
} from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";

type Sub = { key: string; en: string; ar: string; fr: string };
type Cat = { key: string; en: string; ar: string; fr: string; subcategories: Sub[] };

type Row = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  price: number;
  compareAt: number | null;
  stock: number;
  category: string;
  subcategory: string;
  tags: string[];
  image: string;
};

const TAG_OPTIONS = ["new", "sale", "bestseller", "limited"];

function rowsEqual(a: Row, b: Row): boolean {
  return (
    a.nameEn === b.nameEn &&
    a.nameAr === b.nameAr &&
    a.nameFr === b.nameFr &&
    a.price === b.price &&
    a.compareAt === b.compareAt &&
    a.stock === b.stock &&
    a.category === b.category &&
    a.subcategory === b.subcategory &&
    a.tags.length === b.tags.length &&
    a.tags.every((t) => b.tags.includes(t))
  );
}

export function BulkEditTable({
  initialRows,
  categories,
  dbReady = false,
}: {
  initialRows: Row[];
  categories: Cat[];
  dbReady?: boolean;
}) {
  const { d, locale } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const original = useMemo(() => {
    const map = new Map<string, Row>();
    initialRows.forEach((r) => map.set(r.id, r));
    return map;
  }, [initialRows]);

  const dirtyIds = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const o = original.get(r.id);
      if (o && !rowsEqual(r, o)) set.add(r.id);
    });
    return set;
  }, [rows, original]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.nameEn.toLowerCase().includes(q) ||
        r.nameAr.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
      );
    });
  }, [rows, query, categoryFilter]);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const toggleTag = (id: string, tag: string) => {
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, tags: r.tags.includes(tag) ? r.tags.filter((t) => t !== tag) : [...r.tags, tag] }
          : r,
      ),
    );
  };

  const resetAll = () => setRows(initialRows);

  const saveAll = () => {
    if (!dbReady || dirtyIds.size === 0) return;
    const patches: Array<{ id: string; patch: ProductPatch }> = [];
    dirtyIds.forEach((id) => {
      const r = rows.find((x) => x.id === id);
      const o = original.get(id);
      if (!r || !o) return;
      const patch: ProductPatch = {};
      if (r.nameEn !== o.nameEn) patch.nameEn = r.nameEn;
      if (r.nameAr !== o.nameAr) patch.nameAr = r.nameAr;
      if (r.nameFr !== o.nameFr) patch.nameFr = r.nameFr;
      if (r.price !== o.price) patch.price = r.price;
      if (r.compareAt !== o.compareAt) patch.compareAt = r.compareAt;
      if (r.stock !== o.stock) patch.stock = r.stock;
      if (r.category !== o.category) patch.category = r.category;
      if (r.subcategory !== o.subcategory) patch.subcategory = r.subcategory;
      const tagsChanged =
        r.tags.length !== o.tags.length || r.tags.some((t) => !o.tags.includes(t));
      if (tagsChanged) patch.tags = r.tags;
      patches.push({ id, patch });
    });

    start(async () => {
      try {
        const result = await bulkUpdateProductsAction(patches);
        push(`Saved ${result.count} product${result.count === 1 ? "" : "s"}`, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  const subcatsFor = (catKey: string) =>
    categories.find((c) => c.key === catKey)?.subcategories ?? [];

  return (
    <>
      <PageHeader
        title="Bulk edit products"
        subtitle={`${rows.length} products. Click any cell, type, Enter to save row, or save all at once.`}
        actions={
          <>
            <Link
              href="/admin/products"
              className="px-4 py-2 text-sm font-medium text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
            >
              ← Back to list
            </Link>
            <button
              type="button"
              onClick={resetAll}
              disabled={dirtyIds.size === 0 || pending}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={!dbReady || dirtyIds.size === 0 || pending}
              className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
            >
              {pending
                ? "Saving…"
                : dirtyIds.size > 0
                  ? `Save ${dirtyIds.size} change${dirtyIds.size === 1 ? "" : "s"}`
                  : "No changes"}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 h-9 bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--a-ink-muted)]">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 border border-[var(--a-line)] bg-[var(--a-surface)] px-3 text-sm rounded"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c[locale] || c.en}
              </option>
            ))}
          </select>
          <div className="text-xs text-[var(--a-ink-muted)] ms-auto">
            Showing {filtered.length} of {rows.length} · {dirtyIds.size} modified
          </div>
        </section>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-x-auto">
          <table className="w-full text-sm min-w-[1400px]">
            <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] sticky top-14 z-10">
              <tr>
                <th className="text-start px-3 py-3 w-12"></th>
                <th className="text-start px-3 py-3 w-12"></th>
                <th className="text-start px-3 py-3 min-w-[200px]">Name (EN)</th>
                <th className="text-start px-3 py-3 min-w-[200px]">Name (AR)</th>
                <th className="text-start px-3 py-3 min-w-[160px]">Category</th>
                <th className="text-start px-3 py-3 min-w-[140px]">Subcategory</th>
                <th className="text-end px-3 py-3 w-28">Price (MAD)</th>
                <th className="text-end px-3 py-3 w-28">Compare at</th>
                <th className="text-end px-3 py-3 w-20">Stock</th>
                <th className="text-start px-3 py-3 min-w-[260px]">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-line-soft)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-[var(--a-ink-muted)]">
                    No products match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const dirty = dirtyIds.has(r.id);
                  return (
                    <tr key={r.id} className={`${dirty ? "bg-[var(--a-warning-bg)]/30 border-s-2 border-[var(--a-warning)]" : ""}`}>
                      <td className="px-3 py-2">
                        {dirty && (
                          <span className="text-[10px] text-[var(--a-warning)] font-medium">●</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/products/${r.id}`}
                          className="relative block w-10 h-12 bg-[var(--a-line-soft)] overflow-hidden rounded-sm"
                          title={r.id}
                        >
                          {r.image && (
                            <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.nameEn}
                          onChange={(e) => update(r.id, { nameEn: e.target.value })}
                          className="w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm bg-transparent rounded-sm outline-none"
                        />
                        <div className="text-[10px] text-[var(--a-ink-faint)] ps-2">{r.id}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={r.nameAr}
                          dir="rtl"
                          onChange={(e) => update(r.id, { nameAr: e.target.value })}
                          className="w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm bg-transparent rounded-sm outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={r.category}
                          onChange={(e) => {
                            const nextCat = e.target.value;
                            const subs = subcatsFor(nextCat);
                            const stillValid = subs.some((s) => s.key === r.subcategory);
                            update(r.id, {
                              category: nextCat,
                              subcategory: stillValid ? r.subcategory : subs[0]?.key ?? r.subcategory,
                            });
                          }}
                          className="w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm bg-transparent rounded-sm outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c[locale] || c.en}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={r.subcategory}
                          onChange={(e) => update(r.id, { subcategory: e.target.value })}
                          className="w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm bg-transparent rounded-sm outline-none"
                        >
                          {subcatsFor(r.category).map((s) => (
                            <option key={s.key} value={s.key}>
                              {s[locale] || s.en}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-end">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={r.price}
                          onChange={(e) => update(r.id, { price: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                          className="w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm text-end bg-transparent rounded-sm outline-none num"
                        />
                      </td>
                      <td className="px-3 py-2 text-end">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={r.compareAt ?? ""}
                          placeholder="—"
                          onChange={(e) => {
                            const v = e.target.value;
                            update(r.id, { compareAt: v === "" ? null : Math.max(0, Math.floor(Number(v) || 0)) });
                          }}
                          className="w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm text-end bg-transparent rounded-sm outline-none num"
                        />
                      </td>
                      <td className="px-3 py-2 text-end">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={r.stock}
                          onChange={(e) => update(r.id, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                          className={`w-full border border-transparent hover:border-[var(--a-line)] focus:border-[var(--a-accent)] px-2 py-1 text-sm text-end bg-transparent rounded-sm outline-none num ${
                            r.stock === 0 ? "text-[var(--a-danger)] font-semibold" : r.stock <= 5 ? "text-[var(--a-warning)] font-semibold" : ""
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {TAG_OPTIONS.map((tag) => {
                            const active = r.tags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(r.id, tag)}
                                className={`px-2 py-0.5 text-[11px] font-medium rounded-sm border transition-colors ${
                                  active
                                    ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)] border-[var(--a-accent)]"
                                    : "border-[var(--a-line)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        {dirtyIds.size > 0 && (
          <div className="sticky bottom-4 z-20 flex justify-center">
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] shadow-lg rounded-md px-4 py-2 flex items-center gap-3">
              <span className="text-sm font-medium">
                {dirtyIds.size} unsaved change{dirtyIds.size === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={resetAll}
                disabled={pending}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={saveAll}
                disabled={pending}
                className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-4 py-1.5 text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "Saving…" : "Save all"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
