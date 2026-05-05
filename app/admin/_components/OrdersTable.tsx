"use client";

import { useMemo, useState, useTransition } from "react";
import type { OrderRow } from "@/app/_lib/db/orders-repo";
import {
  deleteOrderAction,
  setOrderStatusAction,
} from "@/app/_lib/db/orders-actions";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { Modal } from "./Modal";
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
                  <tr key={o.id} className="hover:bg-[var(--a-line-soft)]/50">
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
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setOpenOrder(o)}
                          className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] rounded-sm"
                        >
                          View
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${o.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] rounded-sm"
                        >
                          WhatsApp
                        </a>
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

      <Modal
        open={!!openOrder}
        onClose={() => setOpenOrder(null)}
        title={openOrder ? `Order #${openOrder.id}` : "Order"}
        size="lg"
      >
        {openOrder && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">
                  Customer
                </div>
                <div className="mt-1 font-medium">{openOrder.customerName}</div>
                <div className="text-xs text-[var(--a-ink-muted)]">{openOrder.phone}</div>
                <div className="text-xs text-[var(--a-ink-muted)]">{openOrder.city}</div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">
                  Order
                </div>
                <div className="mt-1">{new Date(openOrder.createdAt).toLocaleString()}</div>
                <div className="text-xs text-[var(--a-ink-muted)] capitalize">
                  Status: {openOrder.status}
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--a-line)] pt-3">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] mb-2">
                Items
              </div>
              <ul className="space-y-2">
                {openOrder.items.map((it, i) => (
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
                      {openOrder.currency} {(it.unitPrice * it.qty).toLocaleString(numLocale)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--a-line)] pt-3 font-medium">
              <span>Total</span>
              <span className="num">
                {openOrder.currency} {openOrder.subtotal.toLocaleString(numLocale)}
              </span>
            </div>
            {openOrder.notes && (
              <div className="border-t border-[var(--a-line)] pt-3 text-[var(--a-ink-soft)]">
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] mb-1">
                  Notes
                </div>
                {openOrder.notes}
              </div>
            )}
          </div>
        )}
      </Modal>

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
