"use client";

import { useEffect, useState } from "react";
import { LOCALES, useAdminLocale, type Locale } from "../_lib/i18n-admin";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";

const LOCALE_LABEL: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };

export function Topbar({ dbReady = false }: { dbReady?: boolean }) {
  const { d, locale, setLocale, theme, toggleTheme } = useAdminLocale();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="bg-[var(--a-surface)] border-b border-[var(--a-line)] sticky top-0 z-30">
        <div className="px-3 md:px-6 h-14 flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="md:hidden w-9 h-9 flex items-center justify-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            aria-label={d.topbar.search_placeholder}
            className="md:hidden w-9 h-9 flex items-center justify-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex flex-1 max-w-md h-9 px-3 items-center gap-2 bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded text-sm text-[var(--a-ink-muted)] hover:border-[var(--a-ink-faint)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <span className="flex-1 text-start">{d.topbar.search_placeholder}</span>
            <span className="kbd">{d.topbar.cmd_k_hint}</span>
          </button>

          <div className="flex-1" />

          <div
            title={dbReady ? "Connected to database" : "Demo mode — no database"}
            className={`hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded border text-[10px] tracking-[0.2em] uppercase font-medium flex-shrink-0 ${
              dbReady
                ? "bg-[var(--a-success-bg)] border-[color:color-mix(in_srgb,var(--a-success)_30%,transparent)] text-[var(--a-success)]"
                : "bg-[var(--a-warning-bg)] border-[var(--a-warning-line)] text-[var(--a-warning)]"
            }`}
          >
            <span
              aria-hidden
              className={`w-1.5 h-1.5 rounded-full ${
                dbReady ? "bg-[var(--a-success)]" : "bg-[var(--a-warning)]"
              } ${dbReady ? "" : "animate-pulse"}`}
            />
            <span>{dbReady ? "Live" : "Demo"}</span>
          </div>

          <div
            role="group"
            aria-label={d.topbar.lang_label}
            className="flex items-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded h-9 overflow-hidden text-[10px] md:text-[11px] tracking-[0.15em] md:tracking-[0.18em] font-medium flex-shrink-0"
          >
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-2 md:px-3 h-full transition-colors ${
                  locale === l
                    ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)]"
                    : "text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                }`}
              >
                {LOCALE_LABEL[l]}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? d.topbar.theme_light : d.topbar.theme_dark}
            title={theme === "dark" ? d.topbar.theme_light : d.topbar.theme_dark}
            className="w-9 h-9 flex items-center justify-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] transition-colors flex-shrink-0"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <button
            aria-label={d.topbar.notifications}
            title={d.topbar.notifications}
            className="hidden sm:flex w-9 h-9 items-center justify-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  );
}
