"use client";

import { useState } from "react";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";

export type SetupStatus = {
  dbConnected: boolean;
  adminPasswordSet: boolean;
  sessionSecretSet: boolean;
  schemaPushed: boolean;
  productsSeeded: boolean;
  settingsConfigured: boolean;
  productCount: number;
};

const VERCEL_ENV_URL =
  "https://vercel.com/albusaidits-projects/rachel-boutique/settings/environment-variables";
const VERCEL_STORAGE_URL =
  "https://vercel.com/albusaidits-projects/rachel-boutique/stores";

const COPY = {
  ar: {
    title: "تجهيز اللوحة",
    subtitle: "أكملي الخطوات لتفعيل الإدارة بالكامل.",
    db: { ok: "قاعدة البيانات متصلة", todo: "اربطي قاعدة بيانات Neon", action: "فتح Vercel Storage ↗" },
    pwd: { ok: "كلمة مرور الإدارة محدّدة", todo: "حدّدي ADMIN_PASSWORD", action: "فتح متغيرات البيئة ↗" },
    secret: { ok: "سرّ الجلسة محدّد", todo: "حدّدي ADMIN_SECRET", action: "فتح متغيرات البيئة ↗" },
    schema: { ok: "الجداول مُنشأة", todo: "شغّلي npm run db:push", action: "نسخ الأمر" },
    seed: (n: number) => ({ ok: `${n} منتج مُحمّل`, todo: "شغّلي npm run db:seed", action: "نسخ الأمر" }),
    settings: { ok: "إعدادات العلامة محفوظة", todo: "افتحي الإعدادات ثم احفظي", action: "فتح الإعدادات ↗" },
    complete: "اكتمل التجهيز ✦",
    copied: "نُسخ إلى الحافظة",
    copy_failed: "تعذر النسخ",
  },
  en: {
    title: "Setup checklist",
    subtitle: "Finish these to unlock full admin functionality.",
    db: { ok: "Database connected", todo: "Connect a Neon database", action: "Open Vercel Storage ↗" },
    pwd: { ok: "Admin password set", todo: "Set ADMIN_PASSWORD env var", action: "Open env variables ↗" },
    secret: { ok: "Session secret set", todo: "Set ADMIN_SECRET env var", action: "Open env variables ↗" },
    schema: { ok: "Schema pushed", todo: "Run npm run db:push", action: "Copy command" },
    seed: (n: number) => ({ ok: `${n} products seeded`, todo: "Run npm run db:seed", action: "Copy command" }),
    settings: { ok: "Brand settings saved", todo: "Open Settings and click Save", action: "Open settings ↗" },
    complete: "Setup complete ✦",
    copied: "Copied to clipboard",
    copy_failed: "Copy failed",
  },
  fr: {
    title: "Liste de configuration",
    subtitle: "Complétez ces étapes pour activer l'admin.",
    db: { ok: "Base de données connectée", todo: "Connecter une base Neon", action: "Ouvrir Vercel Storage ↗" },
    pwd: { ok: "Mot de passe admin défini", todo: "Définir ADMIN_PASSWORD", action: "Ouvrir variables ↗" },
    secret: { ok: "Secret de session défini", todo: "Définir ADMIN_SECRET", action: "Ouvrir variables ↗" },
    schema: { ok: "Schéma poussé", todo: "Exécutez npm run db:push", action: "Copier la commande" },
    seed: (n: number) => ({ ok: `${n} produits seedés`, todo: "Exécutez npm run db:seed", action: "Copier la commande" }),
    settings: { ok: "Paramètres marque enregistrés", todo: "Ouvrez Paramètres et cliquez Enregistrer", action: "Ouvrir paramètres ↗" },
    complete: "Configuration terminée ✦",
    copied: "Copié dans le presse-papiers",
    copy_failed: "Échec de la copie",
  },
} as const;

type ActionKind =
  | { kind: "link"; href: string; external?: boolean }
  | { kind: "copy"; text: string };

function Row({
  done,
  okLabel,
  todoLabel,
  actionLabel,
  action,
}: {
  done: boolean;
  okLabel: string;
  todoLabel: string;
  actionLabel?: string;
  action?: ActionKind;
}) {
  const { push } = useAdminToast();
  const { d } = useAdminLocale();
  const t = COPY[d.lang as "ar" | "en" | "fr"] ?? COPY.en;

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push(t.copied, "success");
    } catch {
      push(t.copy_failed, "error");
    }
  };

  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <span
        aria-hidden
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          done
            ? "bg-[var(--a-success-bg)] text-[var(--a-success)]"
            : "bg-[var(--a-warning-bg)] text-[var(--a-warning)]"
        }`}
      >
        {done ? "✓" : "!"}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${done ? "text-[var(--a-ink-muted)]" : "font-medium"}`}>
          {done ? okLabel : todoLabel}
        </div>
        {!done && action?.kind === "copy" && (
          <code className="text-[11px] font-mono text-[var(--a-ink-muted)] mt-0.5 block bg-[var(--a-line-soft)] px-2 py-1 rounded inline-block">
            {action.text}
          </code>
        )}
      </div>
      {!done && action && actionLabel && (
        <>
          {action.kind === "link" ? (
            <a
              href={action.href}
              target={action.external !== false ? "_blank" : undefined}
              rel={action.external !== false ? "noopener noreferrer" : undefined}
              className="text-xs px-3 py-1.5 border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:text-[var(--a-ink)] hover:border-[var(--a-ink-faint)] transition-colors whitespace-nowrap rounded-sm"
            >
              {actionLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => onCopy(action.text)}
              className="text-xs px-3 py-1.5 border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:text-[var(--a-ink)] hover:border-[var(--a-ink-faint)] transition-colors whitespace-nowrap rounded-sm"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </li>
  );
}

export function SetupChecklist({ status }: { status: SetupStatus }) {
  const { d } = useAdminLocale();
  const t = COPY[d.lang as "ar" | "en" | "fr"] ?? COPY.en;
  const seed = t.seed(status.productCount);
  const [dismissed, setDismissed] = useState(false);

  const total = 6;
  const done = [
    status.dbConnected,
    status.adminPasswordSet,
    status.sessionSecretSet,
    status.schemaPushed,
    status.productsSeeded,
    status.settingsConfigured,
  ].filter(Boolean).length;

  if (done === total || dismissed) {
    return (
      <div className="bg-[var(--a-surface)] border border-[var(--a-line)] px-5 py-4 flex items-center gap-3">
        <span
          aria-hidden
          className="w-7 h-7 rounded-full bg-[var(--a-success-bg)] text-[var(--a-success)] flex items-center justify-center font-bold"
        >
          ✓
        </span>
        <span className="text-sm font-medium">{t.complete}</span>
      </div>
    );
  }

  return (
    <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
      <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">{t.title}</h2>
          <p className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-[var(--a-line-soft)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--a-accent)] transition-all"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--a-ink-muted)] num">
            {done}/{total}
          </span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-[var(--a-ink-faint)] hover:text-[var(--a-ink)] text-base leading-none"
          >
            ×
          </button>
        </div>
      </div>
      <ul className="divide-y divide-[var(--a-line-soft)]">
        <Row
          done={status.dbConnected}
          okLabel={t.db.ok}
          todoLabel={t.db.todo}
          actionLabel={t.db.action}
          action={{ kind: "link", href: VERCEL_STORAGE_URL }}
        />
        <Row
          done={status.adminPasswordSet}
          okLabel={t.pwd.ok}
          todoLabel={t.pwd.todo}
          actionLabel={t.pwd.action}
          action={{ kind: "link", href: VERCEL_ENV_URL }}
        />
        <Row
          done={status.sessionSecretSet}
          okLabel={t.secret.ok}
          todoLabel={t.secret.todo}
          actionLabel={t.secret.action}
          action={{ kind: "link", href: VERCEL_ENV_URL }}
        />
        <Row
          done={status.schemaPushed}
          okLabel={t.schema.ok}
          todoLabel={t.schema.todo}
          actionLabel={t.schema.action}
          action={{ kind: "copy", text: "npm run db:push" }}
        />
        <Row
          done={status.productsSeeded}
          okLabel={seed.ok}
          todoLabel={seed.todo}
          actionLabel={t.seed(0).action}
          action={{ kind: "copy", text: "npm run db:seed" }}
        />
        <Row
          done={status.settingsConfigured}
          okLabel={t.settings.ok}
          todoLabel={t.settings.todo}
          actionLabel={t.settings.action}
          action={{ kind: "link", href: "/admin/settings", external: false }}
        />
      </ul>
    </section>
  );
}
