"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useMotionValue, animate as animateMV } from "framer-motion";
import { useAdminLocale } from "../_lib/i18n-admin";
import { DemoBanner } from "./PageHeader";
import { AreaSparkline } from "./AreaSparkline";
import { SideDrawer } from "./SideDrawer";
import { SetupChecklist, type SetupStatus } from "./SetupChecklist";

type LocalName = { ar: string; en: string; fr?: string };

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
  name: LocalName;
  price: number;
  image: string;
  stock: number;
  sold: number;
};

type PendingOrder = {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  subtotal: number;
  currency: string;
  createdAt: string;
  items: { name: string; size: string; color: string; qty: number; unitPrice: number }[];
};

type StockItem = {
  id: string;
  name: LocalName;
  stock: number;
  image: string;
  price: number;
  category: string;
};

type OrderStats = {
  today: number;
  pending: number;
  confirmed: number;
  revenueToday: number;
  revenue30d: number;
  total: number;
};

type Priority = "urgent" | "high" | "medium";

type AttentionRow =
  | { kind: "order"; key: string; priority: Priority; score: number; order: PendingOrder }
  | { kind: "stock"; key: string; priority: Priority; score: number; product: StockItem };

const EASE = [0.22, 1, 0.36, 1] as const;
const CURRENCY = "MAD";

// Palette shared by the donuts and tiles. Kept as CSS vars so dark mode follows.
const TONE = {
  ink: "var(--a-ink)",
  accent: "var(--a-accent)",
  success: "var(--a-success)",
  warning: "var(--a-warning)",
  danger: "var(--a-danger)",
  info: "var(--a-info)",
  muted: "var(--a-ink-faint)",
} as const;

// ───────────────────────── primitives ─────────────────────────

function CountUp({
  value,
  prefix = "",
  suffix = "",
  locale = "en-US",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  decimals?: number;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const fmt = (v: number) =>
    v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const [display, setDisplay] = useState(() => fmt(0));
  useEffect(() => {
    if (reduce) return;
    const controls = animateMV(mv, value, {
      duration: 0.9,
      ease: EASE,
      onUpdate: (v) => setDisplay(fmt(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale, reduce]);
  return (
    <>
      {prefix}
      {reduce ? fmt(value) : display}
      {suffix}
    </>
  );
}

function Card({
  children,
  className = "",
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`dash-card ${className}`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: Math.min(index * 0.05, 0.4) }}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--a-ink-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function PriorityPill({ p }: { p: Priority }) {
  const map = {
    urgent: { label: "Urgent", cls: "bg-[var(--a-danger-bg)] text-[var(--a-danger)] border-[var(--a-danger-line)]" },
    high: { label: "High", cls: "bg-[var(--a-warning-bg)] text-[var(--a-warning)] border-[var(--a-warning-line)]" },
    medium: { label: "Medium", cls: "bg-[var(--a-surface-2)] text-[var(--a-ink-muted)] border-[var(--a-line)]" },
  } as const;
  const m = map[p];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}

// ───────────────────────── health ring ─────────────────────────

function healthScore(s: { products: number; out: number; low: number; pending: number; stalePending: number }) {
  if (s.products === 0) return 0;
  let score = 100;
  score -= (s.out / s.products) * 60;
  score -= (s.low / s.products) * 20;
  score -= Math.min(s.pending * 1.5, 10);
  score -= Math.min(s.stalePending * 4, 16);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthTier(score: number) {
  if (score >= 85) return { label: "Excellent", color: TONE.success };
  if (score >= 65) return { label: "Good", color: TONE.success };
  if (score >= 40) return { label: "Needs attention", color: TONE.warning };
  return { label: "At risk", color: TONE.danger };
}

function HealthRing({ score }: { score: number }) {
  const reduce = useReducedMotion();
  const tier = healthTier(score);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-5 px-4">
      <div className="relative w-[136px] h-[136px]">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90" aria-hidden>
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--a-line-soft)" strokeWidth="11" />
          <motion.circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={tier.color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: reduce ? c * (1 - score / 100) : c }}
            animate={{ strokeDashoffset: c * (1 - score / 100) }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[34px] leading-none font-semibold num" style={{ color: tier.color }}>
            <CountUp value={score} />
          </span>
          <span className="text-[11px] text-[var(--a-ink-muted)] mt-1">of 100</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">Store health</div>
        <span
          className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ color: tier.color, background: `color-mix(in srgb, ${tier.color} 12%, transparent)` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
          {tier.label}
        </span>
      </div>
    </div>
  );
}

// ───────────────────────── KPI tile ─────────────────────────

function Kpi({
  value,
  label,
  hint,
  tone = "ink",
  href,
}: {
  value: React.ReactNode;
  label: string;
  hint?: string;
  tone?: keyof typeof TONE;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-[20px] sm:text-[26px] leading-tight font-semibold num whitespace-nowrap" style={{ color: TONE[tone] }}>
        {value}
      </div>
      <div className="text-sm text-[var(--a-ink-soft)] mt-1">{label}</div>
      {hint && <div className="text-[11px] text-[var(--a-ink-faint)] mt-0.5 truncate">{hint}</div>}
    </>
  );
  const cls = "dash-tile block px-4 py-3.5 min-w-0";
  return href ? (
    <Link href={href} className={`${cls} dash-tile-link`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// ───────────────────────── donut ─────────────────────────

type Slice = { label: string; value: number; color: string };

function Donut({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const reduce = useReducedMotion();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = 46;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && slices.filter((s) => s.value > 0).length > 1 ? 2.5 : 0;
  let acc = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 px-5 pb-5 pt-1">
      <div className="relative w-[150px] h-[150px] flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--a-line-soft)" strokeWidth="14" />
          {total > 0 &&
            slices.map((s, i) => {
              if (s.value <= 0) return null;
              const len = (s.value / total) * c;
              const dash = Math.max(len - gap, 0.5);
              const offset = -acc;
              acc += len;
              return (
                <motion.circle
                  key={s.label}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeDashoffset={offset}
                  initial={{ strokeDasharray: reduce ? `${dash} ${c}` : `0 ${c}` }}
                  animate={{ strokeDasharray: `${dash} ${c}` }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.2 + i * 0.08 }}
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold num">{total.toLocaleString()}</span>
          <span className="text-[11px] text-[var(--a-ink-muted)]">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 w-full space-y-2.5">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="flex-1 text-[var(--a-ink-soft)]">{s.label}</span>
              <span className="font-semibold num w-10 text-end">{s.value}</span>
              <span className="text-xs text-[var(--a-ink-faint)] num w-10 text-end">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ───────────────────────── helpers ─────────────────────────

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function ago(iso: string) {
  const h = hoursSince(iso);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 3, high: 2, medium: 1 };

// ───────────────────────── main ─────────────────────────

export function Dashboard({
  stats,
  orderStats,
  statusCounts,
  categories,
  topProducts,
  revenue,
  pendingOrders,
  lowStockList,
  outOfStockList,
  lastOrderAt,
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
  statusCounts: Record<string, number>;
  categories: CategoryStat[];
  topProducts: TopProduct[];
  revenue: number[];
  pendingOrders: PendingOrder[];
  lowStockList: StockItem[];
  outOfStockList: StockItem[];
  lastOrderAt: string | null;
  dbReady?: boolean;
  setupStatus?: SetupStatus;
}) {
  const { d, locale } = useAdminLocale();
  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";
  const pickName = (n: LocalName) => n[locale] || n.en || n.ar;
  const money = (v: number) => `${CURRENCY} ${v.toLocaleString(numLocale)}`;

  const total30d = orderStats.revenue30d || revenue.reduce((s, v) => s + v, 0);
  const revenueDelta = (() => {
    if (revenue.length < 4 || total30d <= 0) return undefined;
    const mid = Math.floor(revenue.length / 2);
    const prior = revenue.slice(0, mid).reduce((s, v) => s + v, 0);
    const recent = revenue.slice(mid).reduce((s, v) => s + v, 0);
    if (prior <= 0) return undefined;
    return ((recent - prior) / prior) * 100;
  })();

  // Store health is derived from the same numbers shown below, so it never
  // disagrees with the tiles.
  const stalePending = pendingOrders.filter((o) => hoursSince(o.createdAt) > 24).length;
  const score = healthScore({
    products: stats.productsCount,
    out: stats.outOfStock,
    low: stats.lowStock,
    pending: orderStats.pending,
    stalePending,
  });

  const inStock = Math.max(stats.productsCount - stats.outOfStock - stats.lowStock, 0);

  // One ranked worklist instead of several separate panels.
  const rows = useMemo<AttentionRow[]>(() => {
    const out: AttentionRow[] = [];
    for (const o of pendingOrders) {
      const h = hoursSince(o.createdAt);
      const priority: Priority = h > 24 ? "urgent" : h > 4 ? "high" : "medium";
      out.push({ kind: "order", key: `o-${o.id}`, priority, score: PRIORITY_RANK[priority] * 1000 + h, order: o });
    }
    for (const p of outOfStockList) {
      out.push({ kind: "stock", key: `s-${p.id}`, priority: "urgent", score: 3000 + p.price / 100, product: p });
    }
    for (const p of lowStockList) {
      const priority: Priority = p.stock <= 2 ? "high" : "medium";
      out.push({ kind: "stock", key: `s-${p.id}`, priority, score: PRIORITY_RANK[priority] * 1000 + (6 - p.stock), product: p });
    }
    return out.sort((a, b) => b.score - a.score);
  }, [pendingOrders, outOfStockList, lowStockList]);

  const [filter, setFilter] = useState<"all" | "order" | "stock">("all");
  const [selected, setSelected] = useState<AttentionRow | null>(null);
  const visibleRows = rows.filter((r) => filter === "all" || r.kind === filter);

  const statusSlices: Slice[] = [
    { label: "Pending", value: statusCounts.pending ?? 0, color: TONE.warning },
    { label: "Confirmed", value: statusCounts.confirmed ?? 0, color: TONE.info },
    { label: "Shipped", value: statusCounts.shipped ?? 0, color: TONE.accent },
    { label: "Delivered", value: statusCounts.delivered ?? 0, color: TONE.success },
    { label: "Cancelled", value: statusCounts.cancelled ?? 0, color: TONE.muted },
  ];
  const stockSlices: Slice[] = [
    { label: "In stock", value: inStock, color: TONE.success },
    { label: "Low stock (≤ 5)", value: stats.lowStock, color: TONE.warning },
    { label: "Out of stock", value: stats.outOfStock, color: TONE.danger },
  ];

  const categoryCount = categories.length;
  const maxCat = Math.max(1, ...categories.map((c) => c.productCount));

  return (
    <div className="px-4 md:px-8 py-6 space-y-5 max-w-[1400px]">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight">{d.dashboard.title}</h1>
          <div className="flex items-center gap-2 text-sm text-[var(--a-ink-muted)] mt-1">
            <span>RACHÉL</span>
            <span className="text-[var(--a-ink-faint)]">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${dbReady ? "bg-[var(--a-success)]" : "bg-[var(--a-warning)] animate-pulse"}`}
              />
              {dbReady ? "Store live" : "Demo mode"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders" className="dash-btn">Orders</Link>
          <Link href="/admin/inventory" className="dash-btn">Inventory</Link>
          <Link href="/admin/products/new" className="dash-btn dash-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            New product
          </Link>
        </div>
      </div>

      {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}
      {setupStatus && <SetupChecklist status={setupStatus} />}

      {/* ── Hero: health + key numbers ── */}
      <section className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <Card index={0}>
          <HealthRing score={score} />
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card index={1}>
            <Kpi
              value={<CountUp value={total30d} prefix={`${CURRENCY} `} locale={numLocale} />}
              label="Revenue · 30 days"
              hint={
                revenueDelta !== undefined
                  ? `${revenueDelta >= 0 ? "▲" : "▼"} ${Math.abs(revenueDelta).toFixed(0)}% vs prior 15 days`
                  : `${money(orderStats.revenueToday)} today`
              }
            />
          </Card>
          <Card index={2}>
            <Kpi
              value={<CountUp value={orderStats.today} locale={numLocale} />}
              label="Orders today"
              hint={`${orderStats.total.toLocaleString(numLocale)} orders all time`}
              tone="success"
              href="/admin/orders"
            />
          </Card>
          <Card index={3}>
            <Kpi
              value={<CountUp value={orderStats.pending} locale={numLocale} />}
              label="Awaiting confirmation"
              hint={stalePending > 0 ? `${stalePending} waiting over 24h` : "Reply on WhatsApp"}
              tone={orderStats.pending > 0 ? "warning" : "ink"}
              href="/admin/orders"
            />
          </Card>
          <Card index={4}>
            <Kpi
              value={<CountUp value={orderStats.confirmed} locale={numLocale} />}
              label="Confirmed orders"
              hint="Ready to ship"
              tone="info"
              href="/admin/orders"
            />
          </Card>
          <Card index={5}>
            <Kpi
              value={<CountUp value={stats.productsCount} locale={numLocale} />}
              label="Products"
              hint={`${stats.totalStock.toLocaleString(numLocale)} units in stock`}
              href="/admin/products"
            />
          </Card>
          <Card index={6}>
            <Kpi
              value={<CountUp value={stats.lowStock} locale={numLocale} />}
              label="Low stock"
              hint="5 units or fewer"
              tone={stats.lowStock > 0 ? "warning" : "ink"}
              href="/admin/inventory"
            />
          </Card>
          <Card index={7}>
            <Kpi
              value={<CountUp value={stats.outOfStock} locale={numLocale} />}
              label="Out of stock"
              hint="Hidden sales"
              tone={stats.outOfStock > 0 ? "danger" : "ink"}
              href="/admin/inventory"
            />
          </Card>
          <Card index={8}>
            <Kpi
              value={<CountUp value={stats.inventoryValue} prefix={`${CURRENCY} `} locale={numLocale} />}
              label="Inventory value"
              hint="At retail price"
            />
          </Card>
        </div>
      </section>

      {/* ── Meta strip ── */}
      <Card index={9} className="px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-[var(--a-ink-muted)] font-mono">
          <span>Currency <b className="text-[var(--a-ink)] font-medium">{CURRENCY}</b></span>
          <span>Categories <b className="text-[var(--a-ink)] font-medium">{categoryCount}</b></span>
          <span>On sale <b className="text-[var(--a-ink)] font-medium">{stats.onSale}</b></span>
          <span>New arrivals <b className="text-[var(--a-ink)] font-medium">{stats.newCount}</b></span>
          <span>
            Last order{" "}
            <b className="text-[var(--a-ink)] font-medium">
              {lastOrderAt
                ? new Date(lastOrderAt).toLocaleString(numLocale, { dateStyle: "medium", timeStyle: "short" })
                : "—"}
            </b>
          </span>
        </div>
      </Card>

      {/* ── Mix donuts ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card index={10}>
          <CardHeader title="Order status" subtitle="Every order by where it is in the pipeline" />
          <Donut slices={statusSlices} centerLabel="orders" />
        </Card>
        <Card index={11}>
          <CardHeader title="Stock health" subtitle="Products by stock level" />
          <Donut slices={stockSlices} centerLabel="products" />
        </Card>
      </section>

      {/* ── Revenue ── */}
      <Card index={12}>
        <CardHeader
          title={d.dashboard.revenue_title}
          subtitle={d.dashboard.revenue_legend}
          action={
            <div className="text-end">
              <div className="text-xl font-semibold num">{money(total30d)}</div>
              {revenueDelta !== undefined && (
                <div
                  className="text-xs font-semibold num"
                  style={{ color: revenueDelta >= 0 ? TONE.success : TONE.danger }}
                >
                  {revenueDelta >= 0 ? "▲" : "▼"} {Math.abs(revenueDelta).toFixed(0)}%
                </div>
              )}
            </div>
          }
        />
        <div className="px-2 pb-4">
          {total30d > 0 ? (
            <AreaSparkline values={revenue} width={1200} height={170} responsive animate />
          ) : (
            <div className="h-[170px] flex flex-col items-center justify-center text-center gap-2 text-[var(--a-ink-muted)]">
              <div className="text-sm">Your revenue chart will appear here after your first order.</div>
              <Link href="/admin/orders" className="text-xs text-[var(--a-accent)] hover:underline">
                View orders →
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* ── Needs attention ── */}
      <Card index={13}>
        <CardHeader
          title="Needs attention"
          subtitle="Ranked by priority. Click a row for details."
          action={
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--a-surface-2)] border border-[var(--a-line)]">
              {(
                [
                  ["all", `All ${rows.length}`],
                  ["order", "Orders"],
                  ["stock", "Stock"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  aria-pressed={filter === k}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === k
                      ? "bg-[var(--a-surface)] text-[var(--a-ink)] shadow-sm"
                      : "text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
        {visibleRows.length === 0 ? (
          <div className="px-5 pb-8 pt-4 text-center">
            <div className="text-sm font-medium">All clear</div>
            <div className="text-xs text-[var(--a-ink-muted)] mt-1">Nothing needs your attention right now.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-start text-[11px] uppercase tracking-wide text-[var(--a-ink-faint)] border-y border-[var(--a-line-soft)]">
                  <th className="text-start font-medium px-5 py-2 w-[100px]">Priority</th>
                  <th className="text-start font-medium px-3 py-2">Item</th>
                  <th className="text-start font-medium px-3 py-2 w-[90px]">Type</th>
                  <th className="text-start font-medium px-3 py-2">Detail</th>
                  <th className="text-end font-medium px-5 py-2 w-[120px]">Value</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr
                    key={r.key}
                    onClick={() => setSelected(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(r);
                      }
                    }}
                    tabIndex={0}
                    className="border-b border-[var(--a-line-soft)] last:border-b-0 cursor-pointer hover:bg-[var(--a-surface-2)] focus-visible:bg-[var(--a-surface-2)] outline-none transition-colors"
                  >
                    <td className="px-5 py-3">
                      <PriorityPill p={r.priority} />
                    </td>
                    {r.kind === "order" ? (
                      <>
                        <td className="px-3 py-3">
                          <span className="font-medium underline decoration-[var(--a-line)] underline-offset-4">
                            Order #{r.order.id}
                          </span>
                          <span className="text-[var(--a-ink-muted)]"> · {r.order.customerName}</span>
                        </td>
                        <td className="px-3 py-3 text-[var(--a-ink-muted)]">Order</td>
                        <td className="px-3 py-3 text-[var(--a-ink-muted)]">
                          Awaiting confirmation · {r.order.city} · {ago(r.order.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-end num font-medium whitespace-nowrap">
                          {r.order.currency} {r.order.subtotal.toLocaleString(numLocale)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3">
                          <span className="font-medium underline decoration-[var(--a-line)] underline-offset-4">
                            {pickName(r.product.name)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[var(--a-ink-muted)]">Stock</td>
                        <td className="px-3 py-3">
                          {r.product.stock === 0 ? (
                            <span className="text-[var(--a-danger)]">Out of stock</span>
                          ) : (
                            <span className="text-[var(--a-warning)]">Only {r.product.stock} left</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-end num font-medium whitespace-nowrap">{money(r.product.price)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Products + categories ── */}
      <section className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <Card index={14}>
          <CardHeader
            title={d.dashboard.top_title}
            subtitle={orderStats.total > 0 ? "By units sold, last 30 days" : d.dashboard.top_subtitle}
            action={
              <Link href="/admin/products" className="text-xs text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]">
                All products →
              </Link>
            }
          />
          {topProducts.length === 0 ? (
            <div className="px-5 pb-6 text-sm text-[var(--a-ink-muted)] text-center">{d.dashboard.no_activity}</div>
          ) : (
            <ul className="pb-2">
              {topProducts.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--a-surface-2)] transition-colors"
                  >
                    <span className="w-4 text-xs text-[var(--a-ink-faint)] num">{i + 1}</span>
                    <div className="relative w-9 h-11 rounded-md bg-[var(--a-line-soft)] overflow-hidden flex-shrink-0">
                      <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{pickName(p.name)}</div>
                      <div className="text-xs text-[var(--a-ink-muted)] num">
                        {money(p.price)} · {p.stock} in stock
                      </div>
                    </div>
                    {p.sold > 0 && (
                      <span className="text-sm font-semibold num">
                        {p.sold} <span className="text-xs font-normal text-[var(--a-ink-muted)]">sold</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card index={15}>
          <CardHeader
            title={d.dashboard.catalog_title}
            subtitle={`${stats.productsCount} products in ${categoryCount} categories`}
          />
          <ul className="px-5 pb-5 space-y-3.5">
            {categories.map((cat) => (
              <li key={cat.key}>
                <Link href={`/admin/products?category=${cat.key}`} className="block group">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 group-hover:text-[var(--a-accent)] transition-colors">
                      <span aria-hidden>{cat.icon}</span>
                      {cat[locale] || cat.en}
                    </span>
                    <span className="font-semibold num">{cat.productCount}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[var(--a-line-soft)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--a-accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.productCount / maxCat) * 100}%` }}
                      transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── Detail drawer ── */}
      <SideDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected?.kind === "order"
            ? `Order #${selected.order.id}`
            : selected?.kind === "stock"
              ? pickName(selected.product.name)
              : ""
        }
        subtitle={
          selected?.kind === "order"
            ? `${selected.order.customerName} · ${selected.order.city} · ${ago(selected.order.createdAt)}`
            : selected?.kind === "stock"
              ? selected.product.stock === 0
                ? "Out of stock"
                : `Only ${selected.product.stock} left`
              : undefined
        }
        footer={
          selected?.kind === "order" ? (
            <>
              <Link href="/admin/orders" className="dash-btn">Open in orders</Link>
              <a
                href={`https://api.whatsapp.com/send?phone=${selected.order.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="dash-btn dash-btn-primary"
              >
                Confirm on WhatsApp
              </a>
            </>
          ) : selected?.kind === "stock" ? (
            <>
              <Link href="/admin/inventory" className="dash-btn">Inventory</Link>
              <Link href={`/admin/products/${selected.product.id}`} className="dash-btn dash-btn-primary">
                Restock product
              </Link>
            </>
          ) : null
        }
      >
        {selected?.kind === "order" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <PriorityPill p={selected.priority} />
              <span className="text-xs text-[var(--a-ink-muted)]">Awaiting confirmation</span>
            </div>
            <section>
              <h3 className="text-[11px] uppercase tracking-wide text-[var(--a-ink-faint)] font-medium mb-2">Items</h3>
              <ul className="space-y-2">
                {selected.order.items.map((it, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg bg-[var(--a-surface-2)] text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-xs text-[var(--a-ink-muted)]">
                        {[it.size, it.color].filter(Boolean).join(" · ")} · Qty {it.qty}
                      </div>
                    </div>
                    <span className="num font-medium whitespace-nowrap">
                      {selected.order.currency} {(it.qty * it.unitPrice).toLocaleString(numLocale)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between mt-3 pt-3 border-t border-[var(--a-line-soft)] text-sm">
                <span className="text-[var(--a-ink-muted)]">Subtotal</span>
                <span className="font-semibold num">
                  {selected.order.currency} {selected.order.subtotal.toLocaleString(numLocale)}
                </span>
              </div>
            </section>
            <section>
              <h3 className="text-[11px] uppercase tracking-wide text-[var(--a-ink-faint)] font-medium mb-2">Customer</h3>
              <dl className="grid grid-cols-[90px_1fr] gap-y-1.5 text-sm">
                <dt className="text-[var(--a-ink-muted)]">Name</dt>
                <dd>{selected.order.customerName}</dd>
                <dt className="text-[var(--a-ink-muted)]">Phone</dt>
                <dd className="font-mono text-xs leading-6">{selected.order.phone}</dd>
                <dt className="text-[var(--a-ink-muted)]">City</dt>
                <dd>{selected.order.city}</dd>
                <dt className="text-[var(--a-ink-muted)]">Placed</dt>
                <dd>{new Date(selected.order.createdAt).toLocaleString(numLocale, { dateStyle: "medium", timeStyle: "short" })}</dd>
              </dl>
            </section>
          </div>
        )}
        {selected?.kind === "stock" && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-[var(--a-line-soft)] flex-shrink-0">
                <Image src={selected.product.image} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="space-y-2 text-sm">
                <PriorityPill p={selected.priority} />
                <div>
                  <span className="text-[var(--a-ink-muted)]">Price </span>
                  <span className="font-semibold num">{money(selected.product.price)}</span>
                </div>
                <div>
                  <span className="text-[var(--a-ink-muted)]">In stock </span>
                  <span
                    className="font-semibold num"
                    style={{ color: selected.product.stock === 0 ? TONE.danger : TONE.warning }}
                  >
                    {selected.product.stock}
                  </span>
                </div>
                <div className="text-xs text-[var(--a-ink-muted)] capitalize">{selected.product.category}</div>
              </div>
            </div>
            <p className="text-sm text-[var(--a-ink-soft)] leading-relaxed">
              {selected.product.stock === 0
                ? "This product is sold out, so customers can't order it. Restock it or hide it from the storefront."
                : "This product is running low. Restock soon so it doesn't sell out."}
            </p>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
