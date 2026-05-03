"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LOCALES, useAdminLocale, type Locale } from "../_lib/i18n-admin";

const LOCALE_LABEL: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { d, locale, setLocale, theme, toggleTheme } = useAdminLocale();
  const from = params.get("from") || "/admin";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace(from);
      router.refresh();
    } else {
      setErr(d.login.invalid);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute top-4 inset-inline-end-4 flex items-center gap-2">
        <div className="flex items-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded h-9 overflow-hidden text-[11px] tracking-[0.18em] font-medium">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-3 h-full transition-colors ${
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
          className="w-9 h-9 flex items-center justify-center bg-[var(--a-surface-2)] border border-[var(--a-line)] rounded text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] transition-colors"
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
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-2xl tracking-[0.18em] font-serif uppercase">RACHÉL</div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-[var(--a-ink-muted)] mt-2">
            {d.login.subtitle}
          </div>
        </div>
        <form onSubmit={submit} className="bg-[var(--a-surface)] border border-[var(--a-line)] p-8 space-y-5">
          <div>
            <label className="block text-[11px] tracking-[0.25em] uppercase text-[var(--a-ink-muted)] mb-2 font-medium">
              {d.login.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full border border-[var(--a-line)] px-4 py-3 text-sm outline-none focus:border-[var(--a-ink)] bg-[var(--a-surface)]"
            />
          </div>
          {err && (
            <div className="text-xs text-[var(--a-danger)] bg-[var(--a-danger-bg)] border border-[var(--a-danger-line)] px-3 py-2">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[var(--a-accent)] text-[var(--a-accent-fg)] py-3 text-xs tracking-[0.3em] uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? d.login.submitting : d.login.submit}
          </button>
          <div className="text-[11px] text-[var(--a-ink-muted)] leading-relaxed border-t border-[var(--a-line)] pt-4">
            {d.login.hint_default}{" "}
            <code className="bg-[var(--a-line-soft)] px-1.5 py-0.5 rounded">rachel-admin</code>.{" "}
            {d.login.hint_env}
          </div>
        </form>
      </div>
    </div>
  );
}
