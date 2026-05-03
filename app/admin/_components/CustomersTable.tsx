"use client";

import { useMemo, useState } from "react";
import { useAdminLocale } from "../_lib/i18n-admin";
import { DemoBanner, PageHeader } from "./PageHeader";

type Customer = {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  city: string;
  orders: number;
  spent: number;
  sinceISO: string;
  isVip: boolean;
  isNew: boolean;
};

export function CustomersTable({
  customers,
  dbReady = false,
}: {
  customers: Customer[];
  dbReady?: boolean;
}) {
  const { d, locale } = useAdminLocale();
  const [query, setQuery] = useState("");
  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(numLocale, { year: "numeric", month: "short" }).format(
        new Date(iso),
      );
    } catch {
      return iso;
    }
  };

  return (
    <>
      <PageHeader title={d.customers.title} subtitle={d.customers.subtitle} />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        {dbReady && customers.length === 0 ? (
          <div className="bg-[var(--a-surface)] border border-[var(--a-line)] py-20 text-center">
            <div className="text-4xl text-[var(--a-ink-faint)] mb-4" aria-hidden>
              ◔
            </div>
            <h2 className="text-base font-semibold mb-2">{d.customers.title}</h2>
            <p className="text-sm text-[var(--a-ink-muted)] max-w-sm mx-auto">
              {d.orders.empty_body}
            </p>
          </div>
        ) : (
        <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <div className="px-4 py-3 border-b border-[var(--a-line)]">
            <div className="flex items-center gap-2 px-3 h-9 bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded max-w-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-[var(--a-ink-muted)]">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={d.customers.search_placeholder}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">
                <tr>
                  <th className="text-start font-medium px-4 py-3">{d.customers.col_customer}</th>
                  <th className="text-end font-medium px-4 py-3">{d.customers.col_orders}</th>
                  <th className="text-end font-medium px-4 py-3">{d.customers.col_spent}</th>
                  <th className="text-start font-medium px-4 py-3">{d.customers.col_since}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-line-soft)]">
                {filtered.map((c) => {
                  const name = locale === "ar" ? c.nameAr : c.nameEn;
                  const initials = name
                    .split(" ")
                    .map((s) => s[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  return (
                    <tr key={c.id} className="hover:bg-[var(--a-line-soft)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden
                            className="w-9 h-9 rounded-full bg-[var(--a-line-soft)] flex items-center justify-center text-xs font-semibold tracking-wide text-[var(--a-ink-soft)]"
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{name}</span>
                              {c.isVip && (
                                <span className="text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 bg-[var(--a-ink)] text-[var(--a-accent-fg)]">
                                  {d.customers.vip}
                                </span>
                              )}
                              {c.isNew && !c.isVip && (
                                <span className="text-[9px] tracking-[0.2em] uppercase px-1.5 py-0.5 bg-[var(--a-success-bg)] text-[var(--a-success)]">
                                  {d.customers.new}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--a-ink-muted)] truncate">
                              {c.email} · {c.city}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end num font-medium">{c.orders}</td>
                      <td className="px-4 py-3 text-end num">
                        SAR {c.spent.toLocaleString(numLocale)}
                      </td>
                      <td className="px-4 py-3 text-[var(--a-ink-muted)] num">{formatDate(c.sinceISO)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </>
  );
}
