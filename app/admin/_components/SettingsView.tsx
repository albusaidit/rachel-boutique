"use client";

import { LOCALES, useAdminLocale, type Locale } from "../_lib/i18n-admin";
import { DemoBanner, PageHeader } from "./PageHeader";

const LOCALE_LABEL: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };

export function SettingsView() {
  const { d, locale, setLocale, theme, setTheme } = useAdminLocale();

  const groups = [
    {
      title: d.settings.group_brand,
      fields: [
        { label: d.settings.brand_name, value: "RACHÉL" },
        { label: d.settings.tagline, value: d.dashboard.subtitle },
        { label: d.settings.default_locale, value: "ar (Arabic)" },
        { label: d.settings.supported_locales, value: "ar · en · fr" },
      ],
    },
    {
      title: d.settings.group_commerce,
      fields: [
        { label: d.settings.currency, value: "SAR" },
        { label: d.settings.free_ship, value: "500 SAR" },
        { label: d.settings.returns_window, value: "14d" },
      ],
    },
    {
      title: d.settings.group_channels,
      fields: [
        { label: d.settings.whatsapp, value: "+966 50 000 0000" },
        { label: d.settings.email, value: "hello@rachel.com" },
        { label: d.settings.instagram, value: "@rachel.boutique" },
      ],
    },
    {
      title: d.settings.group_auth,
      fields: [
        { label: d.settings.admin_password, value: "ADMIN_PASSWORD" },
        { label: d.settings.admin_secret, value: "ADMIN_SECRET" },
        { label: d.settings.session_lifetime, value: "7 days" },
      ],
    },
  ];

  return (
    <>
      <PageHeader title={d.settings.title} subtitle={d.settings.subtitle} />
      <div className="px-8 py-6 space-y-5">
        <DemoBanner>{d.common.demo_banner}</DemoBanner>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <div className="px-5 py-3 border-b border-[var(--a-line)] text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
            {d.settings.group_appearance}
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium mb-2">
                {d.settings.theme_label}
              </div>
              <div className="inline-flex border border-[var(--a-line)] overflow-hidden">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 text-xs tracking-[0.2em] uppercase ${
                      theme === t
                        ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)]"
                        : "bg-[var(--a-surface)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                    }`}
                  >
                    {t === "light" ? d.topbar.theme_light : d.topbar.theme_dark}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium mb-2">
                {d.settings.lang_label}
              </div>
              <div className="inline-flex border border-[var(--a-line)] overflow-hidden">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`px-4 py-2 text-xs tracking-[0.2em] uppercase ${
                      locale === l
                        ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)]"
                        : "bg-[var(--a-surface)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                    }`}
                  >
                    {LOCALE_LABEL[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((group) => (
            <section key={group.title} className="bg-[var(--a-surface)] border border-[var(--a-line)]">
              <div className="px-5 py-3 border-b border-[var(--a-line)] text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                {group.title}
              </div>
              <dl className="divide-y divide-[var(--a-line-soft)]">
                {group.fields.map((f) => (
                  <div
                    key={f.label}
                    className="px-5 py-3 grid grid-cols-[auto_1fr] gap-6 text-sm"
                  >
                    <dt className="text-[var(--a-ink-muted)]">{f.label}</dt>
                    <dd className="text-end font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
