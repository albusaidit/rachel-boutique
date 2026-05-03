"use client";

import { useTransition } from "react";
import { updateSettingsAction } from "@/app/_lib/db/actions";
import type { SettingsMap } from "@/app/_lib/db/settings-repo";
import { LOCALES, useAdminLocale, type Locale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";

const LOCALE_LABEL: Record<Locale, string> = { ar: "AR", en: "EN", fr: "FR" };

export function SettingsView({
  settings,
  dbReady = false,
}: {
  settings: SettingsMap;
  dbReady?: boolean;
}) {
  const { d, locale, setLocale, theme, setTheme } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dbReady) return;
    const formData = new FormData(e.currentTarget);
    start(async () => {
      try {
        await updateSettingsAction(formData);
        push("Settings saved", "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title={d.settings.title}
        subtitle={d.settings.subtitle}
        actions={
          <button
            type="submit"
            disabled={!dbReady || pending}
            title={!dbReady ? d.common.coming_soon : undefined}
            className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "…" : d.product_detail.save}
          </button>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

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
                    type="button"
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
                    type="button"
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
          <Group title={d.settings.group_brand}>
            <Field name="brand_name" label={d.settings.brand_name} value={settings.brand_name} editable={dbReady} />
            <Field name="tagline" label={d.settings.tagline} value={settings.tagline} editable={dbReady} />
            <Field name="default_locale" label={d.settings.default_locale} value={settings.default_locale} editable={dbReady} />
            <Field name="supported_locales" label={d.settings.supported_locales} value={settings.supported_locales} editable={dbReady} />
          </Group>

          <Group title={d.settings.group_commerce}>
            <Field name="currency" label={d.settings.currency} value={settings.currency} editable={dbReady} />
            <Field
              name="free_ship_threshold"
              label={d.settings.free_ship}
              value={settings.free_ship_threshold}
              editable={dbReady}
              hint="SAR"
              inputMode="numeric"
            />
            <Field
              name="returns_window"
              label={d.settings.returns_window}
              value={settings.returns_window}
              editable={dbReady}
              hint="days"
              inputMode="numeric"
            />
          </Group>

          <Group title={d.settings.group_channels}>
            <Field name="whatsapp" label={d.settings.whatsapp} value={settings.whatsapp} editable={dbReady} />
            <Field name="email" label={d.settings.email} value={settings.email} editable={dbReady} inputMode="email" />
            <Field name="instagram" label={d.settings.instagram} value={settings.instagram} editable={dbReady} />
          </Group>

          <Group title={d.settings.group_auth}>
            <ReadOnlyRow label={d.settings.admin_password} value="ADMIN_PASSWORD" />
            <ReadOnlyRow label={d.settings.admin_secret} value="ADMIN_SECRET" />
            <ReadOnlyRow label={d.settings.session_lifetime} value="7 days" />
          </Group>
        </div>
      </div>
    </form>
  );
}


function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
      <div className="px-5 py-3 border-b border-[var(--a-line)] text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {title}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  value,
  hint,
  inputMode,
  editable = false,
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
  inputMode?: "text" | "numeric" | "email" | "tel" | "url" | "search";
  editable?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </span>
      <input
        name={name}
        defaultValue={value}
        inputMode={inputMode}
        disabled={!editable}
        className={`mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm focus:border-[var(--a-ink)] outline-none ${
          editable ? "bg-[var(--a-surface)]" : "bg-[var(--a-line-soft)]/40 disabled:cursor-not-allowed"
        }`}
      />
      {hint && (
        <span className="text-[11px] text-[var(--a-ink-muted)] mt-1 block">{hint}</span>
      )}
    </label>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-6 text-sm py-1.5">
      <dt className="text-[var(--a-ink-muted)]">{label}</dt>
      <dd className="text-end font-mono text-xs">{value}</dd>
    </div>
  );
}
