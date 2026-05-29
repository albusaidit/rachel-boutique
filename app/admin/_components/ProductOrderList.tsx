"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { reorderProductsAction } from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";

type Row = {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  stock: number;
  category: string;
  image: string;
};

type Cat = { key: string; en: string; ar: string; fr: string };

export function ProductOrderList({
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
  const [originalIds, setOriginalIds] = useState<string[]>(() =>
    initialRows.map((r) => r.id),
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const catLabels = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.key, c[locale] || c.en])),
    [categories, locale],
  );

  const dirty = rows.some((r, i) => r.id !== originalIds[i]);

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== idx) setOverIndex(idx);
  };

  const handleDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setOverIndex(null);
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      return;
    }
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const moveTo = (idx: number, delta: number) => {
    const target = idx + delta;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const reset = () => setRows(initialRows);

  const save = () => {
    if (!dbReady || !dirty) return;
    const ids = rows.map((r) => r.id);
    start(async () => {
      try {
        await reorderProductsAction(ids);
        push("Order saved", "success");
        setOriginalIds(ids);
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  // Visual filter: hide rows that don't match, but keep them in the array
  // so positions don't change underfoot when filtering.
  const visible = useMemo(
    () =>
      rows
        .map((r, originalIdx) => ({ r, originalIdx }))
        .filter(({ r }) => categoryFilter === "all" || r.category === categoryFilter),
    [rows, categoryFilter],
  );

  const changedCount = rows.reduce(
    (n, r, i) => n + (r.id !== originalIds[i] ? 1 : 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Order products"
        subtitle="Drag rows to reorder how products appear on the storefront. The order at the top of this list is the order on the shop."
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
              onClick={reset}
              disabled={!dirty || pending}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dbReady || !dirty || pending}
              className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "Saving…" : dirty ? "Save order" : "No changes"}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-3 flex flex-wrap items-center gap-3">
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
            {rows.length} products
            {dirty && (
              <span className="ms-3 text-[var(--a-warning)] font-medium">
                · {changedCount} moved
              </span>
            )}
          </div>
        </section>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <ul className="divide-y divide-[var(--a-line-soft)]">
            {visible.length === 0 ? (
              <li className="px-5 py-12 text-center text-sm text-[var(--a-ink-muted)]">
                No products match this filter.
              </li>
            ) : (
              visible.map(({ r, originalIdx }) => {
                const moved = r.id !== originalIds[originalIdx];
                const isDragging = dragIndex === originalIdx;
                const isOver = overIndex === originalIdx && dragIndex !== originalIdx;
                return (
                  <li
                    key={r.id}
                    draggable
                    onDragStart={handleDragStart(originalIdx)}
                    onDragOver={handleDragOver(originalIdx)}
                    onDrop={handleDrop(originalIdx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      isDragging ? "opacity-30" : ""
                    } ${isOver ? "bg-[var(--a-info-bg)] border-t-2 border-[var(--a-accent)]" : ""} ${
                      moved ? "bg-[var(--a-warning-bg)]/30 border-s-2 border-[var(--a-warning)]" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className="text-[var(--a-ink-faint)] cursor-grab active:cursor-grabbing select-none px-1"
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </span>
                    <span className="w-10 text-end text-xs text-[var(--a-ink-faint)] num tabular-nums">
                      {originalIdx + 1}
                    </span>
                    <Link
                      href={`/admin/products/${r.id}`}
                      className="relative block w-10 h-12 bg-[var(--a-line-soft)] overflow-hidden rounded-sm flex-shrink-0"
                    >
                      {r.image && (
                        <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.nameEn}</div>
                      <div className="text-xs text-[var(--a-ink-muted)] truncate">
                        {catLabels[r.category] ?? r.category} · MAD {r.price.toLocaleString("en-US")} · {r.stock} in stock
                      </div>
                    </div>
                    <div className="inline-flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveTo(originalIdx, -1)}
                        disabled={originalIdx === 0}
                        className="px-2 py-1 text-xs border border-[var(--a-line)] rounded-sm text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] disabled:opacity-30"
                        aria-label="Move up"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTo(originalIdx, 1)}
                        disabled={originalIdx === rows.length - 1}
                        className="px-2 py-1 text-xs border border-[var(--a-line)] rounded-sm text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] disabled:opacity-30"
                        aria-label="Move down"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {dirty && (
          <div className="sticky bottom-4 z-20 flex justify-center">
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] shadow-lg rounded-md px-4 py-2 flex items-center gap-3">
              <span className="text-sm font-medium">
                {changedCount} product{changedCount === 1 ? "" : "s"} moved
              </span>
              <button
                type="button"
                onClick={reset}
                disabled={pending}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-4 py-1.5 text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "Saving…" : "Save order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
