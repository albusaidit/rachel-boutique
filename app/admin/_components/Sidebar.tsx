"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminLocale } from "../_lib/i18n-admin";
import { LogoutButton } from "./LogoutButton";

type IconName =
  | "dashboard"
  | "homepage"
  | "products"
  | "inventory"
  | "orders"
  | "customers"
  | "team"
  | "audit"
  | "settings";

function NavIcon({ name }: { name: IconName }) {
  const p = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
    homepage: <><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10h14V10" /><path d="M9 21v-6h6v6" /></>,
    products: <><path d="M20 7 12 3 4 7l8 4 8-4Z" /><path d="m4 7 8 4v9l-8-4V7Z" /><path d="m20 7-8 4v9l8-4V7Z" /></>,
    inventory: <><path d="M3 4h18v4H3z" /><path d="M5 8v12h14V8" /><path d="M9 12h6" /></>,
    orders: <><path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4Z" /><path d="M4 6h16" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
    customers: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.2A6 6 0 0 1 21 20" /></>,
    team: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    audit: <><path d="M9 4h6l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M14 4v5h5" /><path d="M8 13h8M8 17h5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 2.6V2a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  } satisfies Record<IconName, React.ReactNode>;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {p[name]}
    </svg>
  );
}

export function Sidebar({ role }: { role?: "owner" | "admin" | "fulfillment" | "viewer" }) {
  const { d } = useAdminLocale();
  const pathname = usePathname();
  const isFulfillment = role === "fulfillment";

  // Grouped navigation — dividers separate groups (no text headers, so no i18n needed).
  const GROUPS: { items: { href: string; label: string; icon: IconName }[] }[] = [
    { items: [{ href: "/admin", label: d.nav.dashboard, icon: "dashboard" }] },
    {
      items: [
        { href: "/admin/homepage", label: d.nav.homepage, icon: "homepage" },
        { href: "/admin/products", label: d.nav.products, icon: "products" },
        { href: "/admin/inventory", label: d.nav.inventory, icon: "inventory" },
      ],
    },
    {
      items: [
        { href: "/admin/orders", label: d.nav.orders, icon: "orders" },
        { href: "/admin/customers", label: d.nav.customers, icon: "customers" },
      ],
    },
    {
      items: [
        { href: "/admin/team", label: d.nav.team, icon: "team" },
        { href: "/admin/audit", label: d.nav.audit, icon: "audit" },
        { href: "/admin/settings", label: d.nav.settings, icon: "settings" },
      ],
    },
  ];

  const GROUPS_FINAL = isFulfillment
    ? [{ items: [{ href: "/admin/orders", label: d.nav.orders, icon: "orders" as const }] }]
    : GROUPS;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Flat index across groups so the entrance stagger feels continuous.
  let navIndex = -1;

  return (
    <aside className="bg-[var(--a-surface)] border-e border-[var(--a-line)] flex flex-col min-h-screen w-full">
      <div className="px-6 py-6 border-b border-[var(--a-line)]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/admin" className="group inline-flex flex-col">
            <span className="text-lg tracking-[0.18em] font-serif uppercase transition-[letter-spacing] duration-500 group-hover:tracking-[0.28em]">
              RACHÉL
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--a-ink-muted)] mt-0.5">
              Admin
            </span>
          </Link>
        </motion.div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {GROUPS_FINAL.map((group, gi) => (
          <div
            key={gi}
            className={gi > 0 ? "mt-2 pt-2 border-t border-[var(--a-line-soft)]" : ""}
          >
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                navIndex += 1;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 + navIndex * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 ps-3 pe-3 py-2.5 rounded-md text-sm transition-colors ${
                        active
                          ? "text-[var(--a-ink)] font-medium"
                          : "text-[var(--a-ink-soft)] hover:text-[var(--a-ink)]"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active-pill"
                          aria-hidden
                          className="absolute inset-0 rounded-md bg-[var(--a-line-soft)]"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                        />
                      )}
                      {active && (
                        <motion.span
                          layoutId="nav-active-bar"
                          aria-hidden
                          className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-[var(--a-accent)]"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                        />
                      )}
                      <span
                        className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                          active ? "text-[var(--a-accent)]" : "text-[var(--a-ink-faint)] group-hover:text-[var(--a-ink)]"
                        }`}
                      >
                        <NavIcon name={item.icon} />
                      </span>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--a-line)] px-3 py-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-[var(--a-ink-muted)] hover:bg-[var(--a-line-soft)] hover:text-[var(--a-ink)] transition-colors"
        >
          <span>{d.nav.view_storefront}</span>
          <span aria-hidden>↗</span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
