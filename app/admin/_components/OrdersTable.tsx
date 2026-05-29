"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { OrderRow } from "@/app/_lib/db/orders-repo";
import {
  deleteOrderAction,
  listOrderMessagesAction,
  sendWhatsappReplyAction,
  setOrderStatusAction,
  updateOrderShippingAction,
} from "@/app/_lib/db/orders-actions";
import {
  defaultLangFor,
  LANGS,
  mailtoLink,
  notifyBody,
  notifySubject,
  whatsappLink,
  type Lang,
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
  const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [shipForm, setShipForm] = useState({ trackingNumber: "", carrier: "", shippingNotes: "" });
  const [notifyLang, setNotifyLang] = useState<Record<Stage, Lang>>({
    received: "en",
    confirmed: "en",
    shipped: "en",
    cancelled: "en",
  });
  const [thread, setThread] = useState<
    Array<{
      id: number;
      direction: "in" | "out";
      body: string;
      status: string;
      createdAt: string;
      templateName: string | null;
      error: string | null;
    }>
  >([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyPending, setReplyPending] = useState(false);

  const refreshThread = useCallback(async (orderId: number) => {
    try {
      const msgs = await listOrderMessagesAction(orderId);
      setThread(msgs);
    } catch {
      setThread([]);
    }
  }, []);

  useEffect(() => {
    if (!openOrder) {
      setThread([]);
      setReplyDraft("");
      return;
    }
    setShipForm({
      trackingNumber: openOrder.trackingNumber ?? "",
      carrier: openOrder.carrier ?? "",
      shippingNotes: openOrder.shippingNotes ?? "",
    });
    const def = defaultLangFor(openOrder);
    setNotifyLang({ received: def, confirmed: def, shipped: def, cancelled: def });
    void refreshThread(openOrder.id);
    const t = window.setInterval(() => {
      void refreshThread(openOrder.id);
    }, 15000);
    return () => window.clearInterval(t);
  }, [openOrder, refreshThread]);

  const sendReply = async (o: OrderRow) => {
    const text = replyDraft.trim();
    if (!text) return;
    setReplyPending(true);
    try {
      const res = await sendWhatsappReplyAction(o.id, text);
      if (!res.ok) {
        if (res.error === "whatsapp_not_configured") {
          push("Set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID in Vercel to enable in-portal sending.", "error");
        } else {
          push(`Send failed: ${res.error}`, "error");
        }
        return;
      }
      setReplyDraft("");
      await refreshThread(o.id);
      push("Sent via WhatsApp", "success");
    } finally {
      setReplyPending(false);
    }
  };

  const saveShipping = (o: OrderRow) => {
    start(async () => {
      try {
        await updateOrderShippingAction(o.id, {
          trackingNumber: shipForm.trackingNumber,
          carrier: shipForm.carrier,
          shippingNotes: shipForm.shippingNotes,
        });
        push(d.orders.toast_shipping_saved, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : d.orders.toast_failed, "error");
      }
    });
  };

  const stageOf = (o: OrderRow): Stage => {
    if (o.status === "cancelled") return "cancelled";
    if (o.status === "shipped" || o.status === "delivered") return "shipped";
    if (o.status === "confirmed") return "confirmed";
    return "received";
  };

  const buildNotifyHrefs = (o: OrderRow, stage: Stage, lang: Lang) => {
    const subject = notifySubject(stage, o, lang);
    const body = notifyBody(stage, o, lang);
    return {
      whatsapp: whatsappLink(o.phone, body),
      mailto: o.email ? mailtoLink(o.email, subject, body) : null,
      body,
    };
  };

  const copyBody = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      push(d.orders.toast_copied, "success");
    } catch {
      push(d.orders.toast_copy_failed, "error");
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
    if (status === "cancelled") {
      setCancelReason(o.cancellationReason ?? "");
      setCancelTarget(o);
      return;
    }
    start(async () => {
      try {
        await setOrderStatusAction(o.id, status);
        push(d.orders.toast_status_updated, "success");
      } catch (err) {
        push(err instanceof Error ? err.message : d.orders.toast_failed, "error");
      }
    });
  };

  const confirmCancel = (o: OrderRow) => {
    const reason = cancelReason.trim() || null;
    start(async () => {
      try {
        await setOrderStatusAction(o.id, "cancelled", { cancellationReason: reason });
        push(d.orders.toast_cancelled, "success");
        setCancelTarget(null);
        setCancelReason("");
      } catch (err) {
        push(err instanceof Error ? err.message : d.orders.toast_failed, "error");
      }
    });
  };

  const onDelete = (o: OrderRow) => {
    start(async () => {
      try {
        await deleteOrderAction(o.id);
        push(d.orders.toast_deleted(o.id), "success");
        setConfirmDelete(null);
      } catch (err) {
        push(err instanceof Error ? err.message : d.orders.toast_failed, "error");
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
                <th className="text-start px-4 py-3">{d.orders.col_customer}</th>
                <th className="text-start px-4 py-3">{d.orders.col_city}</th>
                <th className="text-start px-4 py-3">{d.orders.col_items}</th>
                <th className="text-end px-4 py-3">{d.orders.col_total}</th>
                <th className="text-start px-4 py-3">{d.orders.col_status}</th>
                <th className="text-start px-4 py-3">{d.orders.col_date}</th>
                <th className="text-end px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-line-soft)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--a-ink-muted)]">
                    {d.orders.none_match}
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
                      {d.orders.drawer_items(o.items.length)}
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
                          {d.orders.view}
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${o.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-surface)] rounded-sm"
                        >
                          {d.orders.whatsapp}
                        </a>
                        {o.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => onChangeStatus(o, "confirmed")}
                            disabled={pending}
                            className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-success)] hover:bg-[var(--a-success-bg)] rounded-sm disabled:opacity-30"
                          >
                            {d.orders.confirm_action}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(o)}
                          disabled={pending}
                          className="px-2 py-1 text-xs border border-[var(--a-danger-line)] text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] rounded-sm disabled:opacity-30"
                        >
                          {d.orders.delete}
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
          const notify = (s: Stage) => buildNotifyHrefs(o, s, notifyLang[s]);
          const LANG_LABEL: Record<Lang, string> = { ar: "AR", en: "EN", fr: "FR" };
          const StageMarker = ({ active, label, at }: { active: boolean; label: string; at: string | null }) => (
            <div className="flex-1 text-center">
              <div className={`mx-auto w-2.5 h-2.5 rounded-full ${active ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <div className={`mt-1 text-[10px] tracking-[0.15em] uppercase ${active ? "text-[var(--a-ink)] font-medium" : "text-[var(--a-ink-faint)]"}`}>{label}</div>
              {at && <div className="text-[10px] text-[var(--a-ink-faint)]">{new Date(at).toLocaleDateString()}</div>}
            </div>
          );
          const NotifyBlock = ({ s, title, hint }: { s: Stage; title: string; hint: string }) => {
            const activeLang = notifyLang[s];
            const n = notify(s);
            const isDefault = activeLang === defaultLangFor(o);
            const isRtl = activeLang === "ar";
            return (
              <div className="bg-[var(--a-line-soft)]/50 border border-[var(--a-line)] rounded-md p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="text-sm font-medium">{title}</div>
                  <div className="inline-flex border border-[var(--a-line)] rounded-sm overflow-hidden text-[10px] tracking-[0.18em] font-medium">
                    {LANGS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setNotifyLang((prev) => ({ ...prev, [s]: l }))}
                        aria-pressed={activeLang === l}
                        className={`px-2 py-0.5 transition-colors ${
                          activeLang === l
                            ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)]"
                            : "bg-[var(--a-surface)] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                        }`}
                      >
                        {LANG_LABEL[l]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-[var(--a-ink-muted)] mb-1.5">{hint}</div>
                {!isDefault && (
                  <div className="text-[10px] text-[var(--a-ink-faint)] italic mb-1.5">
                    Customer ordered in {LANG_LABEL[defaultLangFor(o)]}
                  </div>
                )}
                <details className="mb-2.5 group">
                  <summary className="text-[11px] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)] cursor-pointer select-none">
                    Preview message ▾
                  </summary>
                  <pre
                    dir={isRtl ? "rtl" : "ltr"}
                    className="mt-1.5 text-[11px] text-[var(--a-ink-soft)] bg-[var(--a-surface)] border border-[var(--a-line)] rounded-sm px-2.5 py-2 whitespace-pre-wrap break-words font-sans max-h-40 overflow-y-auto"
                  >
                    {n.body}
                  </pre>
                </details>
                <div className="flex flex-wrap gap-1.5">
                  <a
                    href={n.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--a-accent)] text-[var(--a-accent-fg)] rounded-sm hover:opacity-90"
                  >
                    {d.orders.send_whatsapp}
                  </a>
                  {n.mailto ? (
                    <a
                      href={n.mailto}
                      className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
                    >
                      {d.orders.send_email}
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 text-xs text-[var(--a-ink-faint)] italic">{d.orders.no_email}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyBody(n.body)}
                    className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
                  >
                    {d.orders.copy_text}
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
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">{d.orders.drawer_customer}</div>
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
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)]">{d.orders.drawer_order}</div>
                <div className="mt-1">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="text-xs text-[var(--a-ink-muted)] mt-1">{d.orders.col_status}</div>
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
              <StageMarker active={true} label={d.orders.stage_received} at={o.createdAt} />
              <div className={`h-px flex-1 ${o.confirmedAt ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <StageMarker active={!!o.confirmedAt} label={d.orders.stage_confirmed} at={o.confirmedAt} />
              <div className={`h-px flex-1 ${o.shippedAt ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <StageMarker active={!!o.shippedAt} label={d.orders.stage_shipped} at={o.shippedAt} />
              <div className={`h-px flex-1 ${o.deliveredAt ? "bg-[var(--a-accent)]" : "bg-[var(--a-line)]"}`} />
              <StageMarker active={!!o.deliveredAt} label={d.orders.stage_delivered} at={o.deliveredAt} />
            </div>

            {/* Cancellation banner */}
            {o.status === "cancelled" && (
              <div className="bg-[var(--a-danger-bg)] border border-[var(--a-danger-line)] rounded-md p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-[var(--a-danger)]">{d.orders.cancelled_banner}</div>
                  {o.cancelledAt && (
                    <div className="text-xs text-[var(--a-ink-muted)]">{new Date(o.cancelledAt).toLocaleString()}</div>
                  )}
                </div>
                {o.cancellationReason ? (
                  <div className="mt-1 text-[var(--a-ink-soft)]">{o.cancellationReason}</div>
                ) : (
                  <div className="mt-1 text-xs text-[var(--a-ink-muted)] italic">{d.orders.no_reason}</div>
                )}
              </div>
            )}

            {/* Notify panels */}
            <div className="space-y-2">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                {d.orders.notify_heading}
              </div>
              {o.status !== "cancelled" && (
                <>
                  <NotifyBlock
                    s="received"
                    title={d.orders.notify_1_title}
                    hint={d.orders.notify_1_hint}
                  />
                  <NotifyBlock
                    s="confirmed"
                    title={d.orders.notify_2_title}
                    hint={
                      stage === "received"
                        ? d.orders.notify_2_hint_pending
                        : d.orders.notify_2_hint_ready
                    }
                  />
                  <NotifyBlock
                    s="shipped"
                    title={d.orders.notify_3_title}
                    hint={
                      o.trackingNumber || o.carrier
                        ? d.orders.notify_3_hint_filled
                        : d.orders.notify_3_hint_empty
                    }
                  />
                </>
              )}
              {o.status === "cancelled" && (
                <NotifyBlock
                  s="cancelled"
                  title={d.orders.notify_cancel_title}
                  hint={
                    o.cancellationReason
                      ? d.orders.notify_cancel_hint_with
                      : d.orders.notify_cancel_hint_without
                  }
                />
              )}
              {o.status !== "cancelled" && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onChangeStatus(o, "cancelled")}
                    disabled={pending}
                    className="px-3 py-1.5 text-xs font-medium border border-[var(--a-danger-line)] text-[var(--a-danger)] rounded-sm hover:bg-[var(--a-danger-bg)] disabled:opacity-40"
                  >
                    {d.orders.cancel_button}
                  </button>
                </div>
              )}
            </div>

            {/* Shipping form */}
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] rounded-md p-4 space-y-3">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                {d.orders.shipping_heading}
              </div>
              <label className="block">
                <span className="text-[11px] text-[var(--a-ink-muted)]">{d.orders.shipping_carrier}</span>
                <input
                  value={shipForm.carrier}
                  onChange={(e) => setShipForm((s) => ({ ...s, carrier: e.target.value }))}
                  placeholder={d.orders.shipping_carrier_ph}
                  className="mt-1 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-[var(--a-ink-muted)]">{d.orders.shipping_tracking}</span>
                <input
                  value={shipForm.trackingNumber}
                  onChange={(e) => setShipForm((s) => ({ ...s, trackingNumber: e.target.value }))}
                  placeholder={d.orders.shipping_tracking_ph}
                  className="mt-1 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm font-mono"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-[var(--a-ink-muted)]">{d.orders.shipping_notes}</span>
                <textarea
                  value={shipForm.shippingNotes}
                  onChange={(e) => setShipForm((s) => ({ ...s, shippingNotes: e.target.value }))}
                  rows={2}
                  placeholder={d.orders.shipping_notes_ph}
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
                  {pending ? "…" : d.orders.shipping_save}
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
                    {d.orders.shipping_save_ship}
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp conversation thread */}
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                  WhatsApp conversation
                </div>
                <button
                  type="button"
                  onClick={() => void refreshThread(o.id)}
                  className="text-[11px] text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
                >
                  Refresh
                </button>
              </div>
              <div className="bg-[var(--a-line-soft)]/40 border border-[var(--a-line)] rounded-sm p-2 max-h-64 overflow-y-auto space-y-2">
                {thread.length === 0 ? (
                  <div className="text-xs text-[var(--a-ink-muted)] italic px-2 py-3 text-center">
                    No WhatsApp messages yet. Customer replies + your sent messages will appear here.
                  </div>
                ) : (
                  thread.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] text-sm rounded-md px-3 py-1.5 whitespace-pre-wrap break-words ${
                          m.direction === "out"
                            ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)]"
                            : "bg-[var(--a-surface)] border border-[var(--a-line)] text-[var(--a-ink)]"
                        }`}
                      >
                        {m.body}
                        <div className={`mt-0.5 text-[10px] opacity-80 ${m.direction === "out" ? "text-end" : ""}`}>
                          {new Date(m.createdAt).toLocaleString()}
                          {m.status === "failed" && (
                            <span className="ms-1 text-red-200">· failed</span>
                          )}
                          {m.templateName && (
                            <span className="ms-1 opacity-80">· {m.templateName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={2}
                  placeholder="Reply to the customer on WhatsApp…"
                  className="flex-1 border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm resize-none"
                />
                <button
                  type="button"
                  onClick={() => sendReply(o)}
                  disabled={replyPending || !replyDraft.trim()}
                  className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-4 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40 self-stretch"
                >
                  {replyPending ? "…" : "Send"}
                </button>
              </div>
              <div className="text-[10px] text-[var(--a-ink-faint)]">
                Uses your Meta WhatsApp Cloud number. Freeform replies work while the customer's 24h session is open; otherwise an approved template is required.
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-[var(--a-line)] pt-4">
              <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] mb-2">
                {d.orders.drawer_items(o.items.length)}
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
              <span>{d.orders.drawer_total}</span>
              <span className="num">
                {o.currency} {o.subtotal.toLocaleString(numLocale)}
              </span>
            </div>
            {o.notes && (
              <div className="border-t border-[var(--a-line)] pt-3 text-[var(--a-ink-soft)]">
                <div className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] mb-1">{d.orders.drawer_notes}</div>
                {o.notes}
              </div>
            )}
          </div>
          );
        })()}
      </SideDrawer>

      <Modal
        open={!!cancelTarget}
        onClose={() => {
          setCancelTarget(null);
          setCancelReason("");
        }}
        title={d.orders.cancel_modal_title}
        size="sm"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <p className="text-sm">
              {d.orders.cancel_modal_body(cancelTarget.id, cancelTarget.customerName)}
            </p>
            <label className="block">
              <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                {d.orders.cancel_modal_reason}
              </span>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                autoFocus
                placeholder={d.orders.cancel_modal_reason_ph}
                className="mt-1.5 w-full border border-[var(--a-line)] px-3 py-2 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm resize-none"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--a-line)]">
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
              >
                {d.orders.cancel_modal_keep}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirmCancel(cancelTarget)}
                className="bg-[var(--a-danger)] text-white px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
              >
                {pending ? "…" : d.orders.cancel_modal_confirm}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={d.orders.delete_modal_title}
        size="sm"
      >
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm">
              {d.orders.delete_modal_body(confirmDelete.id, confirmDelete.customerName)}
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
                {pending ? "…" : d.orders.delete}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
