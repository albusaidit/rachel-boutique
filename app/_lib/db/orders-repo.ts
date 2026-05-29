import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";

export type OrderItem = {
  productId: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
};

export type OrderRow = {
  id: number;
  status: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  locale: string;
  items: OrderItem[];
  subtotal: number;
  currency: string;
  notes: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippingNotes: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToOrder(r: typeof schema.orders.$inferSelect): OrderRow {
  return {
    id: r.id,
    status: r.status,
    customerName: r.customerName,
    phone: r.phone,
    email: r.email ?? null,
    city: r.city,
    locale: r.locale,
    items: r.items as OrderItem[],
    subtotal: r.subtotal,
    currency: r.currency,
    notes: r.notes ?? null,
    trackingNumber: r.trackingNumber ?? null,
    carrier: r.carrier ?? null,
    shippingNotes: r.shippingNotes ?? null,
    confirmedAt: r.confirmedAt ? r.confirmedAt.toISOString() : null,
    shippedAt: r.shippedAt ? r.shippedAt.toISOString() : null,
    deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listOrders(): Promise<OrderRow[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));
    return rows.map(rowToOrder);
  } catch {
    return [];
  }
}

export async function findOrder(id: number): Promise<OrderRow | null> {
  if (!isDbConfigured()) return null;
  const rows = await getDb()
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);
  return rows[0] ? rowToOrder(rows[0]) : null;
}
