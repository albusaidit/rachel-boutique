"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, useMotionValue, animate as animateMV } from "framer-motion";
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
  sold: number;
};

type ActivityItem =
  | { kind: "order"; label: string; when: string }
  | { kind: "low"; name: { ar: string; en: string; fr?: string }; qty: number; when: string }
  | { kind: "sale"; name: { ar: string; en: string; fr?: string }; when: string };

type PendingOrder = {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  subtotal: number;
  currency: string;
  itemCount: number;
  createdAt: string;
};

type LowStockItem = {
  id: string;
  name: { ar: string; en: string; fr?: string };
  stock: number;
  image: string;
};

type OrderStats = {
  today: number;
  pending: number;
  confirmed: number;
  revenueToday: number;
  revenue30d: number;
  total: number;
};

// Smoothly counts a number up from 0 on mount; respects reduced-motion.
function CountUp({
  value,
  prefix = "",
  suffix = "",
  locale = "en-US",
  duration = 1.1,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  duration?: number;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const controls = animateMV(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString(locale)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale, duration]);
  return (
    <>
      {prefix}
      {display}
      {suffix}
    </>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

function Stat({
  label,
  value,
  hint,
  trend,
  delta,
  deltaTitle,
  index = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: number[];
  delta?: number;
  deltaTitle?: string;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <motion.div
      className="group bg-[var(--a-surface)] border border-[var(--a-line)] p-5 relative overflow-hidden"
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.12 + index * 0.08 }}
      whileHover={reduce ? undefined : { y: -4 }}
    >
      {/* accent bar that wipes in on hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[var(--a-accent)] origin-left rtl:origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
      <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-semibold num">{value}</span>
        {hasDelta && (
          <span
            title={deltaTitle}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold num"
            style={{ color: up ? "var(--a-success)" : "var(--a-danger)" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: up ? "none" : "scaleY(-1)" }}>
              <path d="m5 15 7-7 7 7" />
            </svg>
            {Math.abs(delta as number).toFixed(0)}%
          </span>
        )}
      </div>
      {hint && <div className="text-xs text-[var(--a-ink-muted)] mt-1.5">{hint}</div>}
      {trend && trend.length > 0 && (
        <div className="absolute bottom-2 inset-inline-end-2 opacity-70 pointer-events-none">
          <AreaSparkline values={trend} width={84} height={28} />
        </div>
      )}
    </motion.div>
  );
}

function ActionIcon({ name }: { name: "bell" | "box" | "alert" | "trend" }) {
  const p = {
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    box: <><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    trend: <><path d="m3 7 6 6 4-4 8 8" /><path d="M21 17v-6h-6" /></>,
  } satisfies Record<string, React.ReactNode>;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {p[name]}
    </svg>
  );
}

function ActionCard({
  tone,
  icon,
  count,
  label,
  href,
  hint,
  locale = "en-US",
  index = 0,
}: {
  tone: "danger" | "warning" | "info" | "success";
  icon: "bell" | "box" | "alert" | "trend";
  count: number;
  label: string;
  href: string;
  hint?: string;
  locale?: string;
  index?: number;
}) {
  const reduce = useReducedMotion();
  const toneClass =
    tone === "danger"
      ? "bg-[var(--a-danger-bg)] text-[var(--a-danger)] border-[var(--a-danger-line)]"
      : tone === "warning"
        ? "bg-[var(--a-warning-bg)] text-[var(--a-warning)] border-[var(--a-warning-line)]"
        : tone === "success"
          ? "bg-[var(--a-success-bg)] text-[var(--a-success)] border-transparent"
          : "bg-[var(--a-info-bg)] text-[var(--a-ink)] border-transparent";
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: index * 0.07 }}
      whileHover={reduce ? undefined : { y: -3, scale: 1.01 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
    >
      <Link
        href={href}
        className={`group flex items-center gap-4 p-4 rounded-md border transition-shadow hover:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] ${toneClass}`}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/40 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
          <ActionIcon name={icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-semibold leading-none num">
            <CountUp value={count} locale={locale} duration={0.9} />
          </div>
          <div className="text-sm font-medium mt-1 truncate">{label}</div>
          {hint && <div className="text-xs opacity-80 mt-0.5 truncate">{hint}</div>}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden className="opacity-60 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Link>
    </motion.div>
  );
}

function ActivityIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const cls = "w-7 h-7 rounded-full flex items-center justify-center text-[12px]";
  if (kind === "order") {
    return <div className={`${cls} bg-[var(--a-success-bg)] text-[var(--a-success)]`}>★</div>;
  }
  if (kind === "low") {
    return <div className={`${cls} bg-[var(--a-warning-bg)] text-[var(--a-warning)]`}>!</div>;
  }
  return <div className={`${cls} bg-[var(--a-info-bg)] text-[var(--a-ink)]`}>%</div>;
}

export function Dashboard({
  stats,
  orderStats,
  categories,
  topProducts,
  revenue,
  activity,
  pendingOrders,
  lowStockList,
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
  orderStats: OrderStats;
  categories: CategoryStat[];
  topProducts: TopProduct[];
  revenue: number[];
  activity: ActivityItem[];
  pendingOrders: PendingOrder[];
  lowStockList: LowStockItem[];
  dbReady?: boolean;
  setupStatus?: SetupStatus;
}) {
  const { d, locale } = useAdminLocale();
  const reduce = useReducedMotion();
  // Reusable scroll-into-view reveal for the lower content sections.
  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.15 },
        transition: { duration: 0.55, ease: EASE },
      };
  const total30d = orderStats.revenue30d || revenue.reduce((s, v) => s + v, 0);
  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  const currency = "MAD";

  // Revenue trend: last half of the series vs the prior half (≈ last 15d vs
  // previous 15d). Only shown when there's enough signal to be meaningful.
  const revenueDelta = (() => {
    if (!revenue || revenue.length < 4 || total30d <= 0) return undefined;
    const mid = Math.floor(revenue.length / 2);
    const prior = revenue.slice(0, mid).reduce((s, v) => s + v, 0);
    const recent = revenue.slice(mid).reduce((s, v) => s + v, 0);
    if (prior <= 0) return undefined;
    return ((recent - prior) / prior) * 100;
  })();

  const pickName = (n: { ar: string; en: string; fr?: string }) =>
    n[locale] || n.en || n.ar;

  const activityText = (it: ActivityItem) => {
    if (it.kind === "order") return it.label;
    const name = pickName(it.name);
    if (it.kind === "low") return d.dashboard.activity_low(name, it.qty);
    return d.dashboard.activity_sale(name);
  };

  const hasActionItems =
    orderStats.pending > 0 ||
    stats.outOfStock > 0 ||
    stats.lowStock > 0 ||
    orderStats.today > 0;

  return (
    <>
      <PageHeader title={d.dashboard.title} subtitle={d.dashboard.subtitle} />
      <div className="px-8 py-6 space-y-6">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}
        {setupStatus && <SetupChecklist status={setupStatus} />}

        {hasActionItems && (
          <section className="space-y-2">
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium px-1">
              Needs your attention
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {orderStats.pending > 0 && (
                <ActionCard
                  tone="warning"
                  icon="bell"
                  count={orderStats.pending}
                  label="Pending orders to confirm"
                  href="/admin/orders"
                  hint="Reply on WhatsApp"
                  locale={numLocale}
                  index={0}
                />
              )}
              {orderStats.today > 0 && (
                <ActionCard
                  tone="success"
                  icon="box"
                  count={orderStats.today}
                  label="New orders today"
                  href="/admin/orders"
                  hint={`${currency} ${orderStats.revenueToday.toLocaleString(numLocale)} today`}
                  locale={numLocale}
                  index={1}
                />
              )}
              {stats.outOfStock > 0 && (
                <ActionCard
                  tone="danger"
                  icon="alert"
                  count={stats.outOfStock}
                  label="Out of stock"
                  href="/admin/inventory"
                  hint="Restock before they're missed"
                  locale={numLocale}
                  index={2}
                />
              )}
              {stats.lowStock > 0 && (
                <ActionCard
                  tone="warning"
                  icon="trend"
                  count={stats.lowStock}
                  label="Low stock (≤ 5)"
                  href="/admin/inventory"
                  hint="Plan a restock"
                  locale={numLocale}
                  index={3}
                />
              )}
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label={d.dashboard.kpi_revenue}
            value={<CountUp value={total30d} prefix={`${currency} `} locale={numLocale} />}
            hint={orderStats.total > 0 ? `${orderStats.total} orders total` : d.dashboard.kpi_revenue_hint}
            trend={revenue}
            delta={revenueDelta}
            deltaTitle="Last 15 days vs previous 15 days"
            index={0}
          />
          <Stat
            label={d.dashboard.kpi_orders}
            value={<CountUp value={orderStats.total} locale={numLocale} />}
            hint={
              orderStats.pending > 0
                ? `${orderStats.pending} pending, ${orderStats.confirmed} confirmed`
                : d.dashboard.kpi_orders_hint
            }
            index={1}
          />
          <Stat
            label={d.dashboard.kpi_products}
            value={<CountUp value={stats.productsCount} locale={numLocale} />}
            hint={d.dashboard.kpi_products_hint(stats.inventoryValue)}
            index={2}
          />
          <Stat
            label={d.dashboard.kpi_alerts}
            value={<CountUp value={stats.outOfStock + stats.lowStock} locale={numLocale} />}
            hint={d.dashboard.kpi_alerts_hint(stats.outOfStock, stats.lowStock)}
            index={3}
          />
        </section>

        <motion.section className="bg-[var(--a-surface)] border border-[var(--a-line)]" {...reveal}>
          <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">{d.dashboard.revenue_title}</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                {d.dashboard.revenue_legend}
              </div>
            </div>
            <div className="text-end">
              <div className="text-2xl font-semibold num">
                <CountUp value={total30d} prefix={`${currency} `} locale={numLocale} />
              </div>
              <div className="text-[11px] text-[var(--a-ink-muted)] num">
                {orderStats.total > 0 ? "Live data from orders" : "Awaiting first order"}
              </div>
            </div>
          </div>
          <div className="px-2 pt-3 pb-4">
            {total30d > 0 ? (
              <AreaSparkline values={revenue} width={1200} height={180} responsive animate />
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-center gap-2 text-[var(--a-ink-muted)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="opacity-50">
                  <path d="M3 3v18h18" />
                  <path d="m7 14 4-4 3 3 5-6" />
                </svg>
                <div className="text-sm">{orderStats.total > 0 ? "Revenue will appear as orders are confirmed." : "Your revenue chart will appear here after your first order."}</div>
                <Link href="/admin/orders" className="text-xs text-[var(--a-accent)] hover:underline">
                  View orders →
                </Link>
              </div>
            )}
          </div>
        </motion.section>

        {(pendingOrders.length > 0 || lowStockList.length > 0) && (
          <motion.section className="grid grid-cols-1 lg:grid-cols-2 gap-6" {...reveal}>
            {pendingOrders.length > 0 && (
              <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
                <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-wide">Pending orders</h2>
                  <Link href="/admin/orders" className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]">
                    See all →
                  </Link>
                </div>
                <ul className="divide-y divide-[var(--a-line-soft)]">
                  {pendingOrders.map((o) => (
                    <li key={o.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--a-warning-bg)] text-[var(--a-warning)] flex items-center justify-center font-mono text-xs">
                        #{o.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{o.customerName}</div>
                        <div className="text-xs text-[var(--a-ink-muted)] truncate">
                          {o.city} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"} · {o.currency} {o.subtotal.toLocaleString(numLocale)}
                        </div>
                      </div>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${o.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-medium bg-[var(--a-accent)] text-[var(--a-accent-fg)] rounded-sm hover:opacity-90"
                      >
                        WhatsApp
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lowStockList.length > 0 && (
              <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
                <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-wide">Low-stock alerts</h2>
                  <Link href="/admin/inventory" className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]">
                    Inventory →
                  </Link>
                </div>
                <ul className="divide-y divide-[var(--a-line-soft)]">
                  {lowStockList.map((p) => (
                    <li key={p.id} className="px-5 py-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3 hover:bg-[var(--a-line-soft)] -mx-5 px-5 py-1 rounded-sm transition-colors"
                      >
                        <div className="relative w-9 h-12 bg-[var(--a-line-soft)] overflow-hidden flex-shrink-0">
                          <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{pickName(p.name)}</div>
                          <div className="text-xs text-[var(--a-warning)] font-medium">Only {p.stock} left</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}

        <motion.section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6" {...reveal}>
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
                  <Link
                    key={cat.key}
                    href={`/admin/products?category=${cat.key}`}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-[var(--a-line-soft)] transition-colors"
                  >
                    <div className="w-10 text-xl text-center" aria-hidden>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-[var(--a-ink-muted)] mt-0.5">
                        {cat.subCount} subcategories · {cat.productCount} products
                      </div>
                      <div className="mt-2 h-1 bg-[var(--a-line-soft)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[var(--a-accent)] rounded-full"
                          initial={reduce ? false : { width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums w-12 text-end num">
                      {cat.productCount}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--a-surface)] border border-[var(--a-line)]">
            <div className="px-5 py-4 border-b border-[var(--a-line)]">
              <h2 className="text-sm font-semibold tracking-wide">{d.dashboard.top_title}</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                {orderStats.total > 0 ? "By units sold (30d)" : d.dashboard.top_subtitle}
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
                          {p.sold > 0 && ` · ${p.sold} sold`}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </motion.section>

        <motion.section className="bg-[var(--a-surface)] border border-[var(--a-line)]" {...reveal}>
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
                <motion.li
                  key={i}
                  className="px-5 py-3 flex items-center gap-3"
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.4, ease: EASE, delay: Math.min(i * 0.05, 0.4) }}
                >
                  <ActivityIcon kind={it.kind} />
                  <div className="flex-1 text-sm">{activityText(it)}</div>
                  <div className="text-xs text-[var(--a-ink-faint)] num">{it.when}</div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </>
  );
}
