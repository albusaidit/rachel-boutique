"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import type {
  AuditEntry,
  DeletedOrderSummary,
  DeletedProductSummary,
} from "@/app/_lib/db/audit-repo";
import { restoreOrderAction } from "@/app/_lib/db/orders-actions";
import { restoreProductAction } from "@/app/_lib/db/actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";

const ACTION_LABEL: Record<string, string> = {
  "order.created": "Created order",
  "order.status_changed": "Changed status",
  "order.shipping_updated": "Updated shipping",
  "order.deleted": "Deleted order",
  "order.restored": "Restored order",
  "order.whatsapp_sent": "Sent WhatsApp",
  "order.whatsapp_received": "Received WhatsApp",
  "product.created": "Created product",
  "product.updated": "Updated product",
  "product.quick_updated": "Quick-edited product",
  "product.stock_adjusted": "Adjusted stock",
  "product.archived": "Archived product",
  "product.unarchived": "Unarchived product",
  "product.deleted": "Deleted product",
  "product.restored": "Restored product",
  "product.duplicated": "Duplicated product",
  "product.bulk_deleted": "Bulk deleted products",
  "product.bulk_archived": "Bulk archived products",
  "product.bulk_updated": "Bulk updated products",
  "product.imported": "Imported products",
  "product.reordered": "Reordered products",
};

const ACTION_TONE: Record<string, string> = {
  "order.created": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "order.status_changed": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "order.shipping_updated": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "order.deleted": "bg-[var(--a-danger-bg)] text-[var(--a-danger)]",
  "order.restored": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "order.whatsapp_sent": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "order.whatsapp_received": "bg-[var(--a-line-soft)] text-[var(--a-ink)]",
  "product.created": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "product.updated": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "product.quick_updated": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "product.stock_adjusted": "bg-[var(--a-warning-bg)] text-[var(--a-warning)]",
  "product.archived": "bg-[var(--a-line-soft)] text-[var(--a-ink-muted)]",
  "product.unarchived": "bg-[var(--a-line-soft)] text-[var(--a-ink-muted)]",
  "product.deleted": "bg-[var(--a-danger-bg)] text-[var(--a-danger)]",
  "product.restored": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "product.duplicated": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "product.bulk_deleted": "bg-[var(--a-danger-bg)] text-[var(--a-danger)]",
  "product.bulk_archived": "bg-[var(--a-line-soft)] text-[var(--a-ink-muted)]",
  "product.bulk_updated": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "product.imported": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "product.reordered": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
};

const ROLE_TONE: Record<string, string> = {
  owner: "text-[var(--a-accent)]",
  admin: "text-[var(--a-accent)]",
  fulfillment: "text-[var(--a-warning)]",
  viewer: "text-[var(--a-ink-muted)]",
  customer: "text-[var(--a-ink-muted)]",
};

function summarize(entry: AuditEntry): string {
  if (entry.action === "order.status_changed") {
    const before = (entry.before as { status?: string } | null)?.status;
    const after = (entry.after as { status?: string } | null)?.status;
    if (before && after) return `${before} → ${after}`;
    return after ?? "";
  }
  if (entry.action === "order.shipping_updated") {
    const carrier = (entry.after as { carrier?: string | null } | null)?.carrier;
    const tracking = (entry.after as { trackingNumber?: string | null } | null)?.trackingNumber;
    return [carrier, tracking].filter(Boolean).join(" · ");
  }
  if (entry.action === "order.deleted") {
    const customerName = (entry.before as { customerName?: string } | null)?.customerName;
    return customerName ? `Customer: ${customerName}` : "";
  }
  if (entry.action === "order.whatsapp_sent") {
    const preview = (entry.metadata as { preview?: string } | null)?.preview;
    return preview ? `"${preview.slice(0, 80)}${preview.length > 80 ? "…" : ""}"` : "";
  }
  if (entry.action === "order.created") {
    const customerName = (entry.after as { customerName?: string } | null)?.customerName;
    const subtotal = (entry.after as { subtotal?: number } | null)?.subtotal;
    return [customerName, subtotal ? `${subtotal}` : null].filter(Boolean).join(" · ");
  }
  if (entry.action === "product.stock_adjusted") {
    const before = (entry.before as { stock?: number } | null)?.stock;
    const after = (entry.after as { stock?: number } | null)?.stock;
    const delta = (entry.metadata as { delta?: number } | null)?.delta;
    if (typeof before === "number" && typeof after === "number") {
      return `stock ${before} → ${after}${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}`;
    }
    return "";
  }
  if (entry.action === "product.quick_updated" || entry.action === "product.updated") {
    const after = entry.after as Record<string, unknown> | null;
    const before = entry.before as Record<string, unknown> | null;
    const changed: string[] = [];
    if (after) {
      for (const k of ["price", "stock", "nameEn", "nameAr", "category"]) {
        if (after[k] !== undefined && before?.[k] !== after[k]) changed.push(k);
      }
    }
    return changed.length > 0 ? `changed: ${changed.join(", ")}` : "";
  }
  if (entry.action === "product.deleted") {
    const nameEn = (entry.before as { nameEn?: string } | null)?.nameEn;
    return nameEn ? `Was: ${nameEn}` : "";
  }
  if (entry.action === "product.created") {
    const nameEn = (entry.after as { nameEn?: string } | null)?.nameEn;
    const price = (entry.after as { price?: number } | null)?.price;
    return [nameEn, price ? `${price} MAD` : null].filter(Boolean).join(" · ");
  }
  if (entry.action === "product.duplicated") {
    const from = (entry.metadata as { from?: string } | null)?.from;
    return from ? `from ${from}` : "";
  }
  if (
    entry.action === "product.bulk_deleted" ||
    entry.action === "product.bulk_archived" ||
    entry.action === "product.bulk_updated" ||
    entry.action === "product.reordered"
  ) {
    const count = (entry.metadata as { count?: number } | null)?.count;
    return count ? `${count} products` : "";
  }
  return "";
}

export function AuditView({
  events,
  deleted,
  deletedProducts = [],
  dbReady = false,
}: {
  events: AuditEntry[];
  deleted: DeletedOrderSummary[];
  deletedProducts?: DeletedProductSummary[];
  dbReady?: boolean;
}) {
  const { d } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const actorOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.actorUsername) set.add(e.actorUsername);
    });
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        if (actorFilter !== "all" && e.actorUsername !== actorFilter) return false;
        if (actionFilter !== "all" && e.action !== actionFilter) return false;
        return true;
      }),
    [events, actorFilter, actionFilter],
  );

  const onRestore = (orderId: number) => {
    start(async () => {
      try {
        await restoreOrderAction(orderId);
        push(`Order #${orderId} restored`, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Restore failed", "error");
      }
    });
  };

  const onRestoreProduct = (productId: string) => {
    start(async () => {
      try {
        await restoreProductAction(productId);
        push(`Product "${productId}" restored`, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Restore failed", "error");
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Every change to an order is recorded here — who, when, before, after. Restore deleted orders below."
      />
      <div className="px-8 py-6 space-y-6">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        {/* Deleted products / restore section */}
        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Recently deleted products</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                Soft-deleted — restore any product to bring it back exactly as it was, images and stock included.
              </div>
            </div>
            <div className="text-xs text-[var(--a-ink-muted)]">
              {deletedProducts.length} {deletedProducts.length === 1 ? "product" : "products"}
            </div>
          </div>
          {deletedProducts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--a-ink-muted)]">
              No deleted products. The recycle bin is empty.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                <tr>
                  <th className="text-start px-4 py-3 w-14"></th>
                  <th className="text-start px-4 py-3">Product</th>
                  <th className="text-start px-4 py-3">Category</th>
                  <th className="text-end px-4 py-3">Price</th>
                  <th className="text-end px-4 py-3">Stock</th>
                  <th className="text-start px-4 py-3">Deleted</th>
                  <th className="text-start px-4 py-3">By</th>
                  <th className="text-end px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-line-soft)]">
                {deletedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--a-line-soft)]/40">
                    <td className="px-4 py-3">
                      <div className="relative w-10 h-12 bg-[var(--a-line-soft)] overflow-hidden rounded-sm">
                        {p.image && (
                          <Image src={p.image} alt="" fill sizes="40px" className="object-cover" unoptimized />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.nameEn}</div>
                      <div className="text-xs text-[var(--a-ink-muted)]">{p.id}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--a-ink-soft)]">{p.category}</td>
                    <td className="px-4 py-3 text-end num">
                      {p.currency} {p.price.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-end num">{p.stock}</td>
                    <td className="px-4 py-3 text-xs text-[var(--a-ink-muted)]">
                      {p.deletedAt ? new Date(p.deletedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--a-ink-soft)]">
                      {p.deletedByUsername ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => onRestoreProduct(p.id)}
                        disabled={pending}
                        className="px-3 py-1.5 text-xs font-medium bg-[var(--a-accent)] text-[var(--a-accent-fg)] rounded-sm hover:opacity-90 disabled:opacity-40"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Deleted orders / restore section */}
        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--a-line)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Recently deleted orders</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                Deleted orders aren't gone — you can restore them here. Items, customer info, and status timeline come back exactly as they were.
              </div>
            </div>
            <div className="text-xs text-[var(--a-ink-muted)]">
              {deleted.length} {deleted.length === 1 ? "order" : "orders"}
            </div>
          </div>
          {deleted.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--a-ink-muted)]">
              Nothing in the recycle bin.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                <tr>
                  <th className="text-start px-4 py-3">#</th>
                  <th className="text-start px-4 py-3">Customer</th>
                  <th className="text-start px-4 py-3">City</th>
                  <th className="text-end px-4 py-3">Total</th>
                  <th className="text-start px-4 py-3">Deleted</th>
                  <th className="text-start px-4 py-3">By</th>
                  <th className="text-end px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-line-soft)]">
                {deleted.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--a-line-soft)]/40">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--a-ink-soft)]">#{o.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-[var(--a-ink-muted)]">{o.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--a-ink-soft)]">{o.city}</td>
                    <td className="px-4 py-3 text-end num">
                      {o.currency} {o.subtotal.toLocaleString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--a-ink-muted)]">
                      {o.deletedAt ? new Date(o.deletedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--a-ink-soft)]">
                      {o.deletedByUsername ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => onRestore(o.id)}
                        disabled={pending}
                        className="px-3 py-1.5 text-xs font-medium bg-[var(--a-accent)] text-[var(--a-accent-fg)] rounded-sm hover:opacity-90 disabled:opacity-40"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Event log */}
        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--a-line)] flex flex-wrap items-center gap-3">
            <div className="me-auto">
              <h2 className="text-sm font-semibold tracking-wide">Activity log</h2>
              <div className="text-[11px] text-[var(--a-ink-muted)] mt-0.5">
                Last {events.length} events. Most recent first.
              </div>
            </div>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="h-9 border border-[var(--a-line)] bg-[var(--a-surface)] px-3 text-sm rounded"
              aria-label="Filter by user"
            >
              <option value="all">All users</option>
              {actorOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 border border-[var(--a-line)] bg-[var(--a-surface)] px-3 text-sm rounded"
              aria-label="Filter by action"
            >
              <option value="all">All actions</option>
              {Object.entries(ACTION_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {filteredEvents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--a-ink-muted)]">
              No events match this filter.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--a-line-soft)]">
              {filteredEvents.map((e) => (
                <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase rounded-sm font-medium flex-shrink-0 mt-0.5 ${ACTION_TONE[e.action] ?? "bg-[var(--a-line-soft)] text-[var(--a-ink)]"}`}
                  >
                    {ACTION_LABEL[e.action] ?? e.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {e.targetType === "order" && (
                        <Link
                          href={`/admin/orders?focus=${e.targetId}`}
                          className="font-medium hover:underline"
                        >
                          Order #{e.targetId}
                        </Link>
                      )}
                      {e.targetType === "product" && (
                        e.targetId.includes(",") ? (
                          <span className="font-medium">{e.targetId.split(",").length} products</span>
                        ) : (
                          <Link
                            href={`/admin/products/${e.targetId}`}
                            className="font-medium hover:underline font-mono text-xs"
                          >
                            {e.targetId}
                          </Link>
                        )
                      )}
                      {summarize(e) && (
                        <span className="text-[var(--a-ink-soft)]"> · {summarize(e)}</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--a-ink-muted)] mt-0.5">
                      <span className={ROLE_TONE[e.actorRole ?? ""] ?? ""}>
                        {e.actorUsername ?? "system"}
                      </span>
                      {e.actorRole && (
                        <span className="text-[var(--a-ink-faint)]"> · {e.actorRole}</span>
                      )}
                      <span className="text-[var(--a-ink-faint)]">
                        {" · "}
                        {new Date(e.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
