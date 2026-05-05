"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminLocale } from "../_lib/i18n-admin";
import { LogoutButton } from "./LogoutButton";

export function Sidebar() {
  const { d } = useAdminLocale();
  const pathname = usePathname();

  const NAV = [
    { href: "/admin", label: d.nav.dashboard, icon: "▢" },
    { href: "/admin/products", label: d.nav.products, icon: "▤" },
    { href: "/admin/inventory", label: d.nav.inventory, icon: "▧" },
    { href: "/admin/orders", label: d.nav.orders, icon: "▥" },
    { href: "/admin/customers", label: d.nav.customers, icon: "◔" },
    { href: "/admin/team", label: d.nav.team, icon: "◉" },
    { href: "/admin/settings", label: d.nav.settings, icon: "◇" },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="bg-[var(--a-surface)] border-e border-[var(--a-line)] flex flex-col min-h-screen">
      <div className="px-6 py-6 border-b border-[var(--a-line)]">
        <Link href="/admin" className="text-lg tracking-[0.18em] font-serif uppercase">
          RACHÉL
        </Link>
        <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--a-ink-muted)] mt-0.5">
          Admin
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                active
                  ? "bg-[var(--a-line-soft)] text-[var(--a-ink)] font-medium"
                  : "text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] hover:text-[var(--a-ink)]"
              }`}
            >
              <span aria-hidden className="text-xs w-4 text-center text-[var(--a-ink-faint)]">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--a-line)] px-3 py-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded text-xs text-[var(--a-ink-muted)] hover:bg-[var(--a-line-soft)] hover:text-[var(--a-ink)] transition-colors"
        >
          <span>{d.nav.view_storefront}</span>
          <span aria-hidden>↗</span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
