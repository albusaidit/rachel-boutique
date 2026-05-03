"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAdminLocale } from "../_lib/i18n-admin";
import { LogoutButton } from "./LogoutButton";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, locale } = useAdminLocale();
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const NAV = [
    { href: "/admin", label: d.nav.dashboard },
    { href: "/admin/products", label: d.nav.products },
    { href: "/admin/inventory", label: d.nav.inventory },
    { href: "/admin/orders", label: d.nav.orders },
    { href: "/admin/customers", label: d.nav.customers },
    { href: "/admin/settings", label: d.nav.settings },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] md:hidden"
          />
          <motion.aside
            initial={{ x: locale === "ar" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: locale === "ar" ? "100%" : "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 w-[280px] max-w-[85vw] h-screen bg-[var(--a-surface)] border-e border-[var(--a-line)] z-[151] overflow-y-auto md:hidden"
            style={{ insetInlineStart: 0 }}
          >
            <div className="px-6 py-5 border-b border-[var(--a-line)] flex items-center justify-between">
              <div>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="text-lg tracking-[0.18em] font-serif uppercase"
                >
                  RACHÉL
                </Link>
                <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--a-ink-muted)] mt-0.5">
                  Admin
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 -me-2 text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="px-3 py-4 space-y-0.5">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`block px-3 py-3 rounded text-sm transition-colors ${
                      active
                        ? "bg-[var(--a-line-soft)] text-[var(--a-ink)] font-medium"
                        : "text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-[var(--a-line)] px-3 py-3 space-y-1">
              <Link
                href="/"
                target="_blank"
                onClick={onClose}
                className="flex items-center justify-between px-3 py-2 rounded text-xs text-[var(--a-ink-muted)] hover:bg-[var(--a-line-soft)] hover:text-[var(--a-ink)] transition-colors"
              >
                <span>{d.nav.view_storefront}</span>
                <span aria-hidden>↗</span>
              </Link>
              <LogoutButton />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
