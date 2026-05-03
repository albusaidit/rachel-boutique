export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-[var(--a-surface)] border-b border-[var(--a-line)] px-8 py-6 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--a-ink-muted)] mt-1 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function DemoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--a-warning-bg)] border border-[var(--a-warning-line)] text-[var(--a-warning)] text-xs px-4 py-2.5 rounded-sm flex items-start gap-2">
      <span aria-hidden className="leading-none mt-0.5">⚠</span>
      <div>{children}</div>
    </div>
  );
}
