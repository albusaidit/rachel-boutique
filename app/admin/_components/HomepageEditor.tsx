"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveHomepageLayoutAction } from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";

type Section = {
  key: string;
  label: string;
  description: string;
  visible: boolean;
};

export function HomepageEditor({
  initialSections,
  dbReady = false,
}: {
  initialSections: Section[];
  dbReady?: boolean;
}) {
  const { d } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [snapshot, setSnapshot] = useState<Section[]>(initialSections);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const dirty = useMemo(
    () =>
      sections.length !== snapshot.length ||
      sections.some(
        (s, i) => s.key !== snapshot[i].key || s.visible !== snapshot[i].visible,
      ),
    [sections, snapshot],
  );

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
    setSections((prev) => {
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
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const toggleVisible = (idx: number) =>
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, visible: !s.visible } : s)),
    );

  const reset = () => setSections(snapshot);

  const save = () => {
    if (!dbReady || !dirty) return;
    const payload = sections.map((s) => ({ key: s.key, visible: s.visible }));
    start(async () => {
      try {
        await saveHomepageLayoutAction(payload);
        push("Homepage saved", "success");
        setSnapshot(sections);
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Homepage layout"
        subtitle="Drag sections to reorder how the storefront homepage is laid out. Toggle the eye icon to hide a section without deleting it."
        actions={
          <>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] inline-flex items-center gap-1.5"
            >
              Preview storefront <span aria-hidden>↗</span>
            </a>
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
              {pending ? "Saving…" : dirty ? "Save layout" : "No changes"}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        <section className="bg-[var(--a-info-bg)] border border-[var(--a-line)] px-4 py-3 text-sm text-[var(--a-ink-soft)] rounded-md">
          The order in this list = the order customers see on the storefront. Drag the <span aria-hidden>⋮⋮</span> handle, or use the ↑ / ↓ buttons. The eye toggle hides a section without removing it.
        </section>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <ol className="divide-y divide-[var(--a-line-soft)]">
            {sections.map((s, idx) => {
              const isDragging = dragIndex === idx;
              const isOver = overIndex === idx && dragIndex !== idx;
              return (
                <li
                  key={s.key}
                  draggable
                  onDragStart={handleDragStart(idx)}
                  onDragOver={handleDragOver(idx)}
                  onDrop={handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 px-5 py-4 transition-colors ${
                    isDragging ? "opacity-30" : ""
                  } ${isOver ? "bg-[var(--a-info-bg)] border-t-2 border-[var(--a-accent)]" : ""} ${
                    !s.visible ? "opacity-60" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="text-[var(--a-ink-faint)] cursor-grab active:cursor-grabbing select-none px-1"
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </span>
                  <span className="w-8 text-end text-xs text-[var(--a-ink-faint)] num tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {s.label}
                      {!s.visible && (
                        <span className="ms-2 text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] bg-[var(--a-line-soft)] px-1.5 py-0.5 rounded-sm">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--a-ink-muted)] mt-0.5">
                      {s.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVisible(idx)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors ${
                      s.visible
                        ? "border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)]"
                        : "border-[var(--a-accent)] text-[var(--a-accent)] hover:bg-[var(--a-info-bg)]"
                    }`}
                    title={s.visible ? "Hide this section" : "Show this section"}
                  >
                    {s.visible ? "Visible" : "Hidden"}
                  </button>
                  <div className="inline-flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveTo(idx, -1)}
                      disabled={idx === 0}
                      className="px-2 py-1 text-xs border border-[var(--a-line)] rounded-sm text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTo(idx, 1)}
                      disabled={idx === sections.length - 1}
                      className="px-2 py-1 text-xs border border-[var(--a-line)] rounded-sm text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="text-xs text-[var(--a-ink-muted)] px-1">
          Looking to reorder <Link href="/admin/products/order" className="underline hover:text-[var(--a-ink)]">individual products within a grid</Link>?
        </p>

        {dirty && (
          <div className="sticky bottom-4 z-20 flex justify-center">
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] shadow-lg rounded-md px-4 py-2 flex items-center gap-3">
              <span className="text-sm font-medium">Unsaved changes</span>
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
                {pending ? "Saving…" : "Save layout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
