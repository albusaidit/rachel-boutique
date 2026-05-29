"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { AuditEntry, DeletedOrderSummary } from "@/app/_lib/db/audit-repo";
import { restoreOrderAction } from "@/app/_lib/db/orders-actions";
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
};

const ACTION_TONE: Record<string, string> = {
  "order.created": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "order.status_changed": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "order.shipping_updated": "bg-[var(--a-info-bg)] text-[var(--a-ink)]",
  "order.deleted": "bg-[var(--a-danger-bg)] text-[var(--a-danger)]",
  "order.restored": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "order.whatsapp_sent": "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  "order.whatsapp_received": "bg-[var(--a-line-soft)] text-[var(--a-ink)]",
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
  return "";
}

export function AuditView({
  events,
  deleted,
  dbReady = false,
}: {
  events: AuditEntry[];
  deleted: DeletedOrderSummary[];
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

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Every change to an order is recorded here — who, when, before, after. Restore deleted orders below."
      />
      <div className="px-8 py-6 space-y-6">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

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
