"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { products } from "@/app/(storefront)/_lib/products";
import { useAdminLocale } from "../_lib/i18n-admin";

type Item = {
  id: string;
  group: "pages" | "products" | "actions";
  label: string;
  hint?: string;
  action: () => void | Promise<void>;
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { d, locale } = useAdminLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: Item[] = useMemo(() => {
    const navItems: Item[] = [
      { id: "p-dash", group: "pages", label: d.nav.dashboard, action: () => router.push("/admin") },
      { id: "p-homepage", group: "pages", label: d.nav.homepage, action: () => router.push("/admin/homepage") },
      { id: "p-products", group: "pages", label: d.nav.products, action: () => router.push("/admin/products") },
      { id: "p-inventory", group: "pages", label: d.nav.inventory, action: () => router.push("/admin/inventory") },
      { id: "p-orders", group: "pages", label: d.nav.orders, action: () => router.push("/admin/orders") },
      { id: "p-customers", group: "pages", label: d.nav.customers, action: () => router.push("/admin/customers") },
      { id: "p-team", group: "pages", label: d.nav.team, action: () => router.push("/admin/team") },
      { id: "p-settings", group: "pages", label: d.nav.settings, action: () => router.push("/admin/settings") },
    ];

    const productItems: Item[] = products.map((p) => ({
      id: `prod-${p.id}`,
      group: "products",
      label: p.name[locale] || p.name.en,
      hint: `${p.id} · MAD ${p.price.toLocaleString("en-US")}`,
      action: () => router.push(`/admin/products/${p.id}`),
    }));

    const actions: Item[] = [
      {
        id: "a-storefront",
        group: "actions",
        label: d.palette.action_storefront,
        action: () => {
          window.open("/", "_blank");
        },
      },
      {
        id: "a-export",
        group: "actions",
        label: d.palette.action_export,
        action: () => router.push("/admin/products?export=1"),
      },
      {
        id: "a-logout",
        group: "actions",
        label: d.palette.action_logout,
        action: async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          router.replace("/admin/login");
          router.refresh();
        },
      },
    ];

    return [...navItems, ...productItems, ...actions];
  }, [router, locale, d]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.hint ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const it = filtered[active];
        if (it) {
          onClose();
          void it.action();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, active, onClose]);

  const groupLabel = (g: Item["group"]) =>
    g === "pages" ? d.palette.group_pages : g === "products" ? d.palette.group_products : d.palette.group_actions;

  let lastGroup: Item["group"] | null = null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500]"
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[14vh] mx-auto max-w-xl bg-[var(--a-surface)] border border-[var(--a-line)] rounded-lg shadow-2xl z-[501] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 h-12 border-b border-[var(--a-line)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--a-ink-muted)]">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={d.palette.placeholder}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <span className="kbd">Esc</span>
            </div>

            <div className="max-h-[55vh] overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[var(--a-ink-muted)]">
                  {d.palette.empty}
                </div>
              ) : (
                <div className="py-1">
                  {filtered.map((it, idx) => {
                    const showGroup = lastGroup !== it.group;
                    lastGroup = it.group;
                    const isActive = idx === active;
                    return (
                      <div key={it.id}>
                        {showGroup && (
                          <div className="px-4 pt-3 pb-1 text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-faint)] font-medium">
                            {groupLabel(it.group)}
                          </div>
                        )}
                        <button
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => {
                            onClose();
                            void it.action();
                          }}
                          className={`w-full px-4 py-2 flex items-center justify-between gap-3 text-sm transition-colors ${
                            isActive ? "bg-[var(--a-line-soft)] text-[var(--a-ink)]" : "text-[var(--a-ink-soft)]"
                          }`}
                        >
                          <span className="truncate text-start">{it.label}</span>
                          {it.hint && (
                            <span className="text-xs text-[var(--a-ink-faint)] truncate">{it.hint}</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 h-9 border-t border-[var(--a-line)] text-[11px] text-[var(--a-ink-muted)]">
              <span>{d.palette.hint_navigate}</span>
              <span>{d.palette.hint_select}</span>
              <span>{d.palette.hint_close}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
