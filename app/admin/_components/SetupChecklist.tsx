"use client";

import { useAdminLocale } from "../_lib/i18n-admin";

export type SetupStatus = {
  dbConnected: boolean;
  adminPasswordSet: boolean;
  sessionSecretSet: boolean;
  schemaPushed: boolean;
  productsSeeded: boolean;
  settingsConfigured: boolean;
  productCount: number;
};

const COPY = {
  ar: {
    title: "تجهيز اللوحة",
    subtitle: "أكملي الخطوات لتفعيل الإدارة بالكامل.",
    db: { ok: "قاعدة البيانات متصلة", todo: "اربطي قاعدة بيانات Neon", action: "Vercel → Storage" },
    pwd: { ok: "كلمة مرور الإدارة محدّدة", todo: "حدّدي ADMIN_PASSWORD", action: "Vercel → Env" },
    secret: { ok: "سرّ الجلسة محدّد", todo: "حدّدي ADMIN_SECRET", action: "Vercel → Env" },
    schema: { ok: "الجداول مُنشأة", todo: "شغّلي npm run db:push" },
    seed: (n: number) => ({ ok: `${n} منتج مُحمّل`, todo: "شغّلي npm run db:seed" }),
    settings: { ok: "إعدادات العلامة محفوظة", todo: "احفظي إعدادات العلامة لأول مرة" },
    complete: "اكتمل التجهيز ✦",
  },
  en: {
    title: "Setup checklist",
    subtitle: "Finish these to unlock full admin functionality.",
    db: { ok: "Database connected", todo: "Connect a Neon database", action: "Vercel → Storage" },
    pwd: { ok: "Admin password set", todo: "Set ADMIN_PASSWORD env var", action: "Vercel → Env" },
    secret: { ok: "Session secret set", todo: "Set ADMIN_SECRET env var", action: "Vercel → Env" },
    schema: { ok: "Schema pushed", todo: "Run npm run db:push" },
    seed: (n: number) => ({ ok: `${n} products seeded`, todo: "Run npm run db:seed" }),
    settings: { ok: "Brand settings saved", todo: "Open Settings and click Save once" },
    complete: "Setup complete ✦",
  },
  fr: {
    title: "Liste de configuration",
    subtitle: "Complétez ces étapes pour activer l'admin.",
    db: { ok: "Base de données connectée", todo: "Connecter une base Neon", action: "Vercel → Storage" },
    pwd: { ok: "Mot de passe admin défini", todo: "Définir ADMIN_PASSWORD", action: "Vercel → Env" },
    secret: { ok: "Secret de session défini", todo: "Définir ADMIN_SECRET", action: "Vercel → Env" },
    schema: { ok: "Schéma poussé", todo: "Exécutez npm run db:push" },
    seed: (n: number) => ({ ok: `${n} produits seedés`, todo: "Exécutez npm run db:seed" }),
    settings: { ok: "Paramètres marque enregistrés", todo: "Ouvrez Paramètres et cliquez Enregistrer" },
    complete: "Configuration terminée ✦",
  },
} as const;

function Row({
  done,
  okLabel,
  todoLabel,
  hint,
}: {
  done: boolean;
  okLabel: string;
  todoLabel: string;
  hint?: string;
}) {
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
        {!done && hint && (
          <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">{hint}</div>
        )}
      </div>
    </li>
  );
}

export function SetupChecklist({ status }: { status: SetupStatus }) {
  const { locale } = useAdminLocale();
  const t = COPY[locale];
  const seed = t.seed(status.productCount);

  const total = 6;
  const done = [
    status.dbConnected,
    status.adminPasswordSet,
    status.sessionSecretSet,
    status.schemaPushed,
    status.productsSeeded,
    status.settingsConfigured,
  ].filter(Boolean).length;

  if (done === total) {
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
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 bg-[var(--a-line-soft)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--a-accent)] transition-all"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--a-ink-muted)] num">
            {done}/{total}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-[var(--a-line-soft)]">
        <Row
          done={status.dbConnected}
          okLabel={t.db.ok}
          todoLabel={t.db.todo}
          hint={t.db.action}
        />
        <Row
          done={status.adminPasswordSet}
          okLabel={t.pwd.ok}
          todoLabel={t.pwd.todo}
          hint={t.pwd.action}
        />
        <Row
          done={status.sessionSecretSet}
          okLabel={t.secret.ok}
          todoLabel={t.secret.todo}
          hint={t.secret.action}
        />
        <Row done={status.schemaPushed} okLabel={t.schema.ok} todoLabel={t.schema.todo} />
        <Row done={status.productsSeeded} okLabel={seed.ok} todoLabel={seed.todo} />
        <Row done={status.settingsConfigured} okLabel={t.settings.ok} todoLabel={t.settings.todo} />
      </ul>
    </section>
  );
}
