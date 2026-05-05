"use client";

import Link from "next/link";
import Image from "next/image";
import { useAdminLocale } from "../_lib/i18n-admin";
import { DemoBanner, PageHeader } from "./PageHeader";
import { AreaSparkline } from "./AreaSparkline";
import { SetupChecklist, type SetupStatus } from "./SetupChecklist";

type CategoryStat = {
  key: string;
  ar: string;
  en: string;
  fr: string;
  icon: string;
  subCount: number;
  productCount: number;
};

type TopProduct = {
  id: string;
  name: { ar: string; en: string; fr?: string };
  price: number;
  image: string;
  stock: number;
};

type ActivityItem =
  | { kind: "added"; name: { ar: string; en: string; fr?: string }; when: string }
  | { kind: "low"; name: { ar: string; en: string; fr?: string }; qty: number; when: string }
  | { kind: "sale"; name: { ar: string; en: string; fr?: string }; when: string }
  | { kind: "limited"; name: { ar: string; en: string; fr?: string }; when: string };

function Stat({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: number[];
}) {
  return (
    <div className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 relative overflow-hidden">
      <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </div>
      <div className="text-3xl font-semibold mt-2 num">{value}</div>
      {hint && <div className="text-xs text-[var(--a-ink-muted)] mt-1.5">{hint}</div>}
      {trend && trend.length > 0 && (
        <div className="absolute bottom-2 inset-inline-end-2 opacity-70 pointer-events-none">
          <AreaSparkline values={trend} width={84} height={28} />
        </div>
      )}
    </div>
  );
}

function ActivityIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const cls = "w-7 h-7 rounded-full flex items-center justify-center text-[12px]";
  if (kind === "added") {
    return <div className={`${cls} bg-[var(--a-success-bg)] text-[var(--a-success)]`}>+</div>;
  }
  if (kind === "low") {
    return <div className={`${cls} bg-[var(--a-warning-bg)] text-[var(--a-warning)]`}>!</div>;
  }
  if (kind === "sale") {
    return <div className={`${cls} bg-[var(--a-info-bg)] text-[var(--a-ink)]`}>%</div>;
  }
  return <div className={`${cls} bg-[var(--a-line-soft)] text-[var(--a-ink)]`}>★</div>;
}

export function Dashboard({
  stats,
  categories,
  topProducts,
  revenue,
  activity,
  dbReady = false,
  setupStatus,
}: {
  stats: {
    productsCount: number;
    totalStock: number;
    outOfStock: number;
    lowStock: number;
    onSale: number;
    newCount: number;
    inventoryValue: number;
  };
  categories: CategoryStat[];
  topProducts: TopProduct[];
  revenue: number[];
  activity: ActivityItem[];
  dbReady?: boolean;
  setupStatus?: SetupStatus;
}) {
  const { d, locale } = useAdminLocale();
  const total30d = revenue.reduce((s, v) => s + v, 0);
  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  const currency = "MAD";

  const pickName = (n: { ar: string; en: string; fr?: string }) =>
    n[locale] || n.en || n.ar;

  const activityText = (it: ActivityItem) => {
    const name = pickName(it.name);
    if (it.kind === "added") return d.dashboard.activity_added(name);
    if (it.kind === "low") return d.dashboard.activity_low(name, it.qty);
    if (it.kind === "sale") return d.dashboard.activity_sale(name);
    return d.dashboard.activity_limited(name);
  };

  return (
    <>
      <PageHeader title={d.dashboard.title} subtitle={d.dashboard.subtitle} />
      <div className="px-8 py-6 space-y-6">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}
        {setupStatus && <SetupChecklist status={setupStatus} />}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label={d.dashboard.kpi_revenue}
            value={`${currency} ${total30d.toLocaleString(numLocale)}`}
            hint={d.dashboard.kpi_revenue_hint}
            trend={revenue}
          />
          <Stat
            label={d.dashboard.kpi_orders}
            value={0}
            hint={d.dashboard.kpi_orders_hint}
          />
          <Stat
            label={d.dashboard.kpi_products}
            value={stats.productsCount}
            hint={d.dashboard.kpi_products_hint(stats.inventoryValue)}
          />
          <Stat
            label={d.dashboard.kpi_alerts}
            value={stats.outOfStock + stats.lowStock}
            hint={d.dashboard.kpi_alerts_hint(stats.outOfStock, stats.lowStock)}
          />
        </section>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">{d.dashboard.revenue_title}</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                {d.dashboard.revenue_legend}
              </div>
            </div>
            <div className="text-end">
              <div className="text-2xl font-semibold num">
                {currency} {total30d.toLocaleString(numLocale)}
              </div>
              <div className="text-[11px] text-[var(--a-success)] num">
                +12.4% vs prev 30d
              </div>
            </div>
          </div>
          <div className="px-2 pt-3 pb-4">
            <AreaSparkline values={revenue} width={1200} height={180} responsive />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
            <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide">{d.dashboard.catalog_title}</h2>
              <Link
                href="/admin/products"
                className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
              >
                {d.dashboard.catalog_view_all}
              </Link>
            </div>
            <div className="divide-y divide-[var(--a-line-soft)]">
              {categories.map((cat) => {
                const pct = stats.productsCount === 0 ? 0 : (cat.productCount / stats.productsCount) * 100;
                const label = cat[locale] || cat.en;
                return (
                  <div key={cat.key} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 text-xl text-center" aria-hidden>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-[var(--a-ink-muted)] mt-0.5">
                        {cat.subCount} · {cat.productCount}
                      </div>
                      <div className="mt-2 h-1 bg-[var(--a-line-soft)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--a-accent)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums w-12 text-end num">
                      {cat.productCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
            <div className="px-5 py-4 border-b border-[var(--a-line)]">
              <h2 className="text-sm font-semibold tracking-wide">{d.dashboard.top_title}</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                {d.dashboard.top_subtitle}
              </div>
            </div>
            <ul className="divide-y divide-[var(--a-line-soft)]">
              {topProducts.length === 0 ? (
                <li className="px-5 py-6 text-sm text-[var(--a-ink-muted)] text-center">
                  {d.dashboard.no_activity}
                </li>
              ) : (
                topProducts.map((p, i) => (
                  <li key={p.id} className="px-5 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3 hover:bg-[var(--a-line-soft)] -mx-5 px-5 py-1 rounded-sm transition-colors"
                    >
                      <span className="w-5 text-xs text-[var(--a-ink-faint)] num">{i + 1}</span>
                      <div className="relative w-9 h-12 bg-[var(--a-line-soft)] overflow-hidden flex-shrink-0">
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{pickName(p.name)}</div>
                        <div className="text-[11px] text-[var(--a-ink-muted)] num">
                          MAD {p.price.toLocaleString(numLocale)}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)]">
          <div className="px-5 py-4 border-b border-[var(--a-line)]">
            <h2 className="text-sm font-semibold tracking-wide">{d.dashboard.activity_title}</h2>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[var(--a-ink-muted)] text-center">
              {d.dashboard.no_activity}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--a-line-soft)]">
              {activity.map((it, i) => (
                <li key={i} className="px-5 py-3 flex items-center gap-3">
                  <ActivityIcon kind={it.kind} />
                  <div className="flex-1 text-sm">{activityText(it)}</div>
                  <div className="text-xs text-[var(--a-ink-faint)] num">{it.when}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
