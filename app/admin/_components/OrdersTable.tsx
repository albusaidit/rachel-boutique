"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { OrderRow } from "@/app/_lib/db/orders-repo";
import {
  deleteOrderAction,
  setOrderStatusAction,
  updateOrderShippingAction,
} from "@/app/_lib/db/orders-actions";
import {
  mailtoLink,
  notifyBody,
  notifySubject,
  whatsappLink,
  type Stage,
} from "../_lib/order-notifications";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { Modal } from "./Modal";
import { SideDrawer } from "./SideDrawer";
import { PageHeader } from "./PageHeader";

const STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_TONE: Record<Status, string> = {
  pending: "bg-[var(--a-warning-bg)] text-[var(--a-warning)]",
  confirmed: "bg-[var(--a-info-bg)] text-blue-700",
  shipped: "bg-[var(--a-info-bg)] text-blue-700",
  delivered: "bg-[var(--a-success-bg)] text-[var(--a-success)]",
  cancelled: "bg-[var(--a-line-soft)] text-[var(--a-ink-muted)]",
};

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const { d, locale } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [openOrder, setOpenOrder] = useState<OrderRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OrderRow | null>(null);
  const [shipForm, setShipForm] = useState({ trackingNumber: "", carrier: "", shippingNotes: "" });

  useEffect(() => {
    if (!openOrder) return;
    setShipForm({
      trackingNumber: openOrder.trackingNumber ?? "",
      carrier: openOrder.carrier ?? "",
      shippingNotes: openOrder.shippingNotes ?? "",
    });
  }, [openOrder]);

  const saveShipping = (o: OrderRow) => {
    start(async () => {
      try {
        await updateOrderShippingAction(o.id, {
          trackingNumber: shipForm.trackingNumber,
          carrier: shipForm.carrier,
          shippingNotes: shipForm.shippingNotes,
        });
        push("Shipping details saved", "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  const stageOf = (o: OrderRow): Stage => {
    if (o.status === "shipped" || o.status === "delivered") return "shipped";
    if (o.status === "confirmed") return "confirmed";
    return "received";
  };

  const buildNotifyHrefs = (o: OrderRow, stage: Stage) => {
    const subject = notifySubject(stage, o);
    const body = notifyBody(stage, o);
    return {
      whatsapp: whatsappLink(o.phone, body),
      mailto: o.email ? mailtoLink(o.email, subject, body) : null,
      body,
    };
  };

  const copyBody = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push("Message copied to clipboard", "success");
    } catch {
      push("Copy failed", "error");
    }
  };

  const numLocale = locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US";

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: orders.length };
    STATUSES.forEach((s) => (m[s] = 0));
    orders.forEach((o) => {
      m[o.status] = (m[o.status] ?? 0) + 1;
    });
    return m;
  }, [orders]);

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? orders
        : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter],
  );

  const onChangeStatus = (o: OrderRow, status: Status) => {
    if (status === o.status) return;
    start(async () => {
      try {
        await setOrderStatusAction(o.id, status);
        push("Status updated", "success");
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  const onDelete = (o: OrderRow) => {
    start(async () => {
      try {
        await deleteOrderAction(o.id);
        push(`Order #${o.id} deleted`, "success");
        setConfirmDelete(null);
      } catch (err) {
        push(err instanceof Error ? err.message : "Failed", "error");
      }
    });
  };

  return (
    <>
      <PageHeader title={d.orders.title} subtitle={d.orders.subtitle} />
      <div className="px-8 py-6 space-y-5">
        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-4">
          <div className="flex flex-wrap gap-2">
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 h-9 rounded-md border text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)] border-[var(--a-accent)]"
                    : "bg-[var(--a-surface)] border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)]"
                }`}
              >
                {s === "all" ? d.products.filter_all : s} ({counts[s] ?? 0})
              </button>
            ))}
          </div>
        </section>

        <section className="bg-[var(--a-surface)] border border-[var(--a-line)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--a-line)] bg-[var(--a-line-soft)]">
              <tr className="text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                <th className="text-start px-4 py-3">#</th>
                <th className="text-start px-4 py-3">Customer</th>
                <th className="text-start px-4 py-3">City</th>
                <th className="text-start px-4 py-3">Items</th>
                <th className="text-end px-4 py-3">Total</th>
                <th className="text-start px-4 py-3">Status</th>
                <th className="text-start px-4 py-3">Date</th>
                <th className="text-end px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-line-soft)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--a-ink-muted)]">
                    No orders match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button, select, a")) return;
                      setOpenOrder(o);
                    }}
                    className="group hover:bg-[var(--a-line-soft)]/50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--a-ink-soft)]">
                      #{o.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-[var(--a-ink-muted)]">{o.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--a-ink-soft)]">{o.city}</td>
                    <td className="px-4 py-3 text-[var(--a-ink-soft)]">
                      {o.items.length} item{o.items.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3 text-end num font-medium">
                      {o.currency} {o.subtotal.toLocaleString(numLocale)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        disabled={pending}
                        onChange={(e) => onChangeStatus(o, e.target.value as Status)}
                        className={`px-2 py-1 text-xs rounded-sm border-0 ${STATUS_TONE[o.status as Status] || ""}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--a-ink-muted)]">
                      {new Date(o.createdAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-end whitespace-nowrap">
                      <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setOpenOrder(o)}
                          className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-surface)] rounded-sm"
                        >
                          View
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${o.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-surface)] rounded-sm"
                        >
                          WhatsApp
                        </a>
                        {o.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => onChangeStatus(o, "confirmed")}
                            disabled={pending}
                            className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-success)] hover:bg-[var(--a-success-bg)] rounded-sm disabled:opacity-30"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(o)}
                          disabled={pending}
                          className="px-2 py-1 text-xs border border-[var(--a-danger-line)] text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] rounded-sm disabled:opacity-30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <SideDrawer
        open={!!openOrder}
        onClose={() => setOpenOrder(null)}
        title={openOrder ? `Order #${openOrder.id}` : "Order"}
        subtitle={openOrder ? `${openOrder.customerName} · ${openOrder.city}` : undefined}
        width={520}
        footer={
          openOrder && (
            <>
              <a
                href={`https://api.whatsapp.com/send?phone=${openOrder.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
              >
                Open WhatsApp
              </a>
              {openOrder.status === "pending" && (
                <button
                  type="button"
                  onClick={() => onChangeStatus(openOrder, "confirmed")}
                  disabled={pending}
                  className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
                >
                  Confirm order
                </button>
              )}
            </>
          )
        }
      >
        {openOrder && (() => {
          const o = openOrder;
          const stage = stageOf(o);
          const notify = (s: Stage) => buildNotifyHrefs(o, s);
          const StageMarker = ({ active, label, at }: { active: boolean; label: string; at: string | null }) => (
            <div className="flex-1 text-center">
              <div className={`mx-auto w-2.5 h-2.5 rounded-full ${active ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <div className={`mt-1 text-[10px] tracking-[0.15em] uppercase ${active ? "text-[var(--a-ink)] font-medium" : "text-[var(--a-ink-faint)]"}`}>{label}</div>
              {at && <div className="text-[10px] text-[var(--a-ink-faint)]">{new Date(at).toLocaleDateString()}</div>}
            </div>
          );
          const NotifyBlock = ({ s, title, hint }: { s: Stage; title: string; hint: string }) => {
            const n = notify(s);
            return (
              <div className="bg-[var(--a-line-soft)]/50 border border-[var(--a-line)] rounded-md p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="text-sm font-medium">{title}</div>
                </div>
                <div className="text-xs text-[var(--a-ink-muted)] mb-2.5">{hint}</div>
                <div className="flex flex-wrap gap-1.5">
                  <a
                    href={n.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--a-accent)] text-[var(--a-accent-fg)] rounded-sm hover:opacity-90"
                  >
                    Send via WhatsApp
                  </a>
                  {n.mailto ? (
                    <a
                      href={n.mailto}
                      className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
                    >
                      Send email
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 text-xs text-[var(--a-ink-faint)] italic">No email on file</span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyBody(n.body)}
                    className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
                  >
                    Copy text
                  </button>
                </div>
              </div>
            );
          };

          return (
          <div className="space-y-5 text-sm">
            {/* Customer + status row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">Customer</div>
                <div className="mt-1 font-medium">{o.customerName}</div>
                <a
                  href={whatsappLink(o.phone, "")}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--a-accent)] hover:underline block num"
                  dir="ltr"
                >
                  {o.phone}
                </a>
                {o.email && (
                  <a href={`mailto:${o.email}`} className="text-xs text-[var(--a-accent)] hover:underline block break-all">
                    {o.email}
                  </a>
                )}
                <div className="text-xs text-[var(--a-ink-muted)]">{o.city}</div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">Order</div>
                <div className="mt-1">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="text-xs text-[var(--a-ink-muted)] mt-1">Status</div>
                <select
                  value={o.status}
                  disabled={pending}
                  onChange={(e) => onChangeStatus(o, e.target.value as Status)}
                  className={`mt-0.5 px-2 py-1 text-xs rounded-sm border-0 ${STATUS_TONE[o.status as Status] || ""}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stage timeline */}
            <div className="border-t border-b border-[var(--a-line)] py-3 flex items-center gap-2">
              <StageMarker active={true} label="Received" at={o.createdAt} />
              <div className={`h-px flex-1 ${o.confirmedAt ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <StageMarker active={!!o.confirmedAt} label="Confirmed" at={o.confirmedAt} />
              <div className={`h-px flex-1 ${o.shippedAt ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <StageMarker active={!!o.shippedAt} label="Shipped" at={o.shippedAt} />
              <div className={`h-px flex-1 ${o.deliveredAt ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <StageMarker active={!!o.deliveredAt} label="Delivered" at={o.deliveredAt} />
            </div>

            {/* 3-stage notify panels */}
            <div className="space-y-2">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                Notify customer
              </div>
              <NotifyBlock
                s="received"
                title="1 · Order received"
                hint="Acknowledge that the order is in. Send this once you see a new pending order."
              />
              <NotifyBlock
                s="confirmed"
                title="2 · Order confirmed"
                hint={
                  stage === "received"
                    ? "Mark the order Confirmed first, then send this message."
                    : "Tell the customer the order is being prepared."
                }
              />
              <NotifyBlock
                s="shipped"
                title="3 · Shipping details"
                hint={
                  o.trackingNumber || o.carrier
                    ? "Tracking is filled in below. Send the customer the details."
                    : "Fill in tracking number / carrier below, then send."
                }
              />
            </div>

            {/* Shipping form */}
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] rounded-md p-4 space-y-3">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                Shipping details
              </div>
              <label className="block">
                <span className="text-[11px] text-[var(--a-ink-muted)]">Carrier</span>
                <input
                  value={shipForm.carrier}
                  onChange={(e) => setShipForm((s) => ({ ...s, carrier: e.target.value }))}
                  placeholder="e.g. Aramex, DHL, Local"
                  className="mt-1 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-[var(--a-ink-muted)]">Tracking number</span>
                <input
                  value={shipForm.trackingNumber}
                  onChange={(e) => setShipForm((s) => ({ ...s, trackingNumber: e.target.value }))}
                  placeholder="e.g. 1234567890"
                  className="mt-1 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm font-mono"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-[var(--a-ink-muted)]">Notes (optional)</span>
                <textarea
                  value={shipForm.shippingNotes}
                  onChange={(e) => setShipForm((s) => ({ ...s, shippingNotes: e.target.value }))}
                  rows={2}
                  placeholder="ETA, delivery instructions, etc."
                  className="mt-1 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm resize-none"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveShipping(o)}
                  disabled={pending}
                  className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-4 py-1.5 text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Save shipping info"}
                </button>
                {o.status !== "shipped" && o.status !== "delivered" && (
                  <button
                    type="button"
                    onClick={() => {
                      saveShipping(o);
                      onChangeStatus(o, "shipped");
                    }}
                    disabled={pending}
                    className="px-4 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-40"
                  >
                    Save + mark Shipped
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-[var(--a-line)] pt-4">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] mb-2">
                Items ({o.items.length})
              </div>
              <ul className="space-y-2">
                {o.items.map((it, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 border-b border-[var(--a-line-soft)] pb-2 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-[var(--a-ink-muted)]">
                        {it.size} · {it.color} · ×{it.qty}
                      </div>
                    </div>
                    <div className="num text-end">
                      {o.currency} {(it.unitPrice * it.qty).toLocaleString(numLocale)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--a-line)] pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="num">
                {o.currency} {o.subtotal.toLocaleString(numLocale)}
              </span>
            </div>
            {o.notes && (
              <div className="border-t border-[var(--a-line)] pt-3 text-[var(--a-ink-soft)]">
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] mb-1">Notes</div>
                {o.notes}
              </div>
            )}
          </div>
          );
        })()}
      </SideDrawer>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete order"
        size="sm"
      >
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm">
              Permanently delete order #{confirmDelete.id} from {confirmDelete.customerName}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
              >
                {d.common.cancel}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete(confirmDelete)}
                className="bg-[var(--a-danger)] text-white px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
