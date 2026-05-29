"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import type { OrderItem, OrderRow } from "./orders-repo";
import { findOrder } from "./orders-repo";
import { getCurrentUser, isAuthed } from "@/app/admin/_lib/auth";
import { isConfigured as waConfigured, sendText as waSendText } from "@/app/_lib/whatsapp/client";
import { defaultLangFor, notifyBody, type Stage } from "@/app/admin/_lib/order-notifications";
import { logAuditEvent, type Actor } from "./audit-repo";

async function currentActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) return { id: null, username: null, role: null };
  return { id: user.id, username: user.username, role: user.role };
}

async function autoSendStage(orderId: number, stage: Stage): Promise<void> {
  if (!waConfigured()) return;
  let order: OrderRow | null = null;
  try {
    order = await findOrder(orderId);
  } catch {
    return;
  }
  if (!order) return;
  const body = notifyBody(stage, order, defaultLangFor(order));
  try {
    await waSendText(order.phone, body, { orderId });
  } catch {
    // best-effort; failures are persisted in whatsapp_messages by the helper
  }
}

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  email?: string;
  city: string;
  locale: string;
  items: OrderItem[];
  subtotal: number;
  currency: string;
  notes?: string;
};

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  if (!isDbConfigured()) {
    return { ok: false, error: "db_not_configured" };
  }
  const customerName = input.customerName.trim();
  const phone = input.phone.trim();
  const city = input.city.trim();
  if (!customerName || !phone || !city) {
    return { ok: false, error: "missing_fields" };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "empty_cart" };
  }
  const safeItems: OrderItem[] = input.items
    .filter((it) => it && typeof it.productId === "string" && typeof it.qty === "number")
    .map((it) => ({
      productId: String(it.productId).slice(0, 64),
      name: String(it.name ?? "").slice(0, 160),
      size: String(it.size ?? "").slice(0, 32),
      color: String(it.color ?? "").slice(0, 32),
      qty: Math.max(1, Math.min(99, Math.floor(it.qty))),
      unitPrice: Math.max(0, Math.floor(it.unitPrice)),
    }));
  if (safeItems.length === 0) return { ok: false, error: "empty_cart" };

  const email = input.email?.trim() || null;

  const [row] = await getDb()
    .insert(schema.orders)
    .values({
      status: "pending",
      customerName,
      phone,
      email,
      city,
      locale: input.locale.slice(0, 8),
      items: safeItems,
      subtotal: Math.max(0, Math.floor(input.subtotal)),
      currency: (input.currency || "MAD").slice(0, 8),
      notes: input.notes?.trim() || null,
    })
    .returning({ id: schema.orders.id });

  void logAuditEvent({
    actor: { id: null, username: "storefront", role: "customer" },
    action: "order.created",
    targetType: "order",
    targetId: String(row.id),
    after: {
      customerName,
      phone,
      city,
      subtotal: input.subtotal,
      itemCount: safeItems.length,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");

  // Best-effort auto-confirmation to the customer. Silent if WA isn't wired up.
  void autoSendStage(row.id, "received");

  return { ok: true, id: row.id };
}

export async function setOrderStatusAction(
  id: number,
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
  opts?: { cancellationReason?: string | null },
) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("db_not_configured");
  const actor = await currentActor();
  const before = await findOrder(id);
  const now = new Date();
  const patch: Partial<typeof schema.orders.$inferInsert> = {
    status,
    updatedAt: now,
  };
  if (status === "confirmed") patch.confirmedAt = now;
  if (status === "shipped") patch.shippedAt = now;
  if (status === "delivered") patch.deliveredAt = now;
  if (status === "cancelled") {
    patch.cancelledAt = now;
    if (opts?.cancellationReason !== undefined) {
      const trimmed = opts.cancellationReason?.trim() ?? "";
      patch.cancellationReason = trimmed || null;
    }
  }
  await getDb()
    .update(schema.orders)
    .set(patch)
    .where(eq(schema.orders.id, id));

  void logAuditEvent({
    actor,
    action: "order.status_changed",
    targetType: "order",
    targetId: String(id),
    before: before ? { status: before.status, cancellationReason: before.cancellationReason } : null,
    after: { status, cancellationReason: opts?.cancellationReason ?? before?.cancellationReason ?? null },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");

  // Auto-notify customer per stage, best effort.
  if (status === "confirmed") void autoSendStage(id, "confirmed");
  if (status === "shipped") void autoSendStage(id, "shipped");
  if (status === "cancelled") void autoSendStage(id, "cancelled");
}

export async function updateOrderShippingAction(
  id: number,
  patch: {
    trackingNumber?: string | null;
    carrier?: string | null;
    shippingNotes?: string | null;
  },
) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("db_not_configured");
  const actor = await currentActor();
  const before = await findOrder(id);
  const trim = (v: string | null | undefined) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    return t || null;
  };
  const update: Partial<typeof schema.orders.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.trackingNumber !== undefined) update.trackingNumber = trim(patch.trackingNumber);
  if (patch.carrier !== undefined) update.carrier = trim(patch.carrier);
  if (patch.shippingNotes !== undefined) update.shippingNotes = trim(patch.shippingNotes);
  await getDb()
    .update(schema.orders)
    .set(update)
    .where(eq(schema.orders.id, id));

  void logAuditEvent({
    actor,
    action: "order.shipping_updated",
    targetType: "order",
    targetId: String(id),
    before: before
      ? {
          carrier: before.carrier,
          trackingNumber: before.trackingNumber,
          shippingNotes: before.shippingNotes,
        }
      : null,
    after: {
      carrier: update.carrier,
      trackingNumber: update.trackingNumber,
      shippingNotes: update.shippingNotes,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
}

export async function deleteOrderAction(id: number) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("db_not_configured");
  const actor = await currentActor();
  const before = await findOrder(id);
  const now = new Date();
  await getDb()
    .update(schema.orders)
    .set({ deletedAt: now, deletedBy: actor.id, updatedAt: now })
    .where(eq(schema.orders.id, id));

  void logAuditEvent({
    actor,
    action: "order.deleted",
    targetType: "order",
    targetId: String(id),
    before: before
      ? {
          status: before.status,
          customerName: before.customerName,
          subtotal: before.subtotal,
          currency: before.currency,
        }
      : null,
    after: null,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
}

export async function restoreOrderAction(id: number) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("db_not_configured");
  const actor = await currentActor();
  if (actor.role === "fulfillment") throw new Error("forbidden");
  await getDb()
    .update(schema.orders)
    .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
    .where(eq(schema.orders.id, id));

  void logAuditEvent({
    actor,
    action: "order.restored",
    targetType: "order",
    targetId: String(id),
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
}

export async function listOrderMessagesAction(orderId: number) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  const { listMessagesForOrder } = await import("@/app/_lib/whatsapp/client");
  return listMessagesForOrder(orderId);
}

export async function sendWhatsappReplyAction(orderId: number, body: string) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!waConfigured()) {
    return { ok: false as const, error: "whatsapp_not_configured" };
  }
  const trimmed = body.trim();
  if (!trimmed) return { ok: false as const, error: "empty_body" };
  if (trimmed.length > 4096) return { ok: false as const, error: "body_too_long" };
  const order = await findOrder(orderId);
  if (!order) return { ok: false as const, error: "order_not_found" };
  const actor = await currentActor();
  const result = await waSendText(order.phone, trimmed, { orderId });
  if (!result.ok) return { ok: false as const, error: result.error };
  void logAuditEvent({
    actor,
    action: "order.whatsapp_sent",
    targetType: "order",
    targetId: String(orderId),
    metadata: { preview: trimmed.slice(0, 160) },
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/audit");
  return { ok: true as const, id: result.id };
}
