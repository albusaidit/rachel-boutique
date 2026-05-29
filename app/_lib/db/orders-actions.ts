"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import type { OrderItem } from "./orders-repo";
import { isAuthed } from "@/app/admin/_lib/auth";

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

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true, id: row.id };
}

export async function setOrderStatusAction(
  id: number,
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
  opts?: { cancellationReason?: string | null },
) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("db_not_configured");
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
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
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
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function deleteOrderAction(id: number) {
  if (!(await isAuthed())) throw new Error("unauthorized");
  if (!isDbConfigured()) throw new Error("db_not_configured");
  await getDb().delete(schema.orders).where(eq(schema.orders.id, id));
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
