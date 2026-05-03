import "server-only";
import { sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";

export type CustomerRow = {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  city: string;
  orders: number;
  spent: number;
  sinceISO: string;
  isVip: boolean;
  isNew: boolean;
};

export async function listCustomers(): Promise<CustomerRow[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select({
        phone: schema.orders.phone,
        name: schema.orders.customerName,
        city: schema.orders.city,
        orders: sql<number>`count(*)::int`,
        spent: sql<number>`sum(${schema.orders.subtotal})::int`,
        since: sql<Date>`min(${schema.orders.createdAt})`,
      })
      .from(schema.orders)
      .groupBy(schema.orders.phone, schema.orders.customerName, schema.orders.city);

    const now = Date.now();
    return rows.map((r, i) => {
      const sinceMs = new Date(r.since).getTime();
      const monthsAgo = Math.floor((now - sinceMs) / (30 * 24 * 60 * 60 * 1000));
      return {
        id: `cust-${(i + 1).toString().padStart(4, "0")}`,
        nameAr: r.name,
        nameEn: r.name,
        email: "",
        city: r.city,
        orders: r.orders,
        spent: r.spent,
        sinceISO: new Date(r.since).toISOString().slice(0, 10),
        isVip: r.spent > 8000,
        isNew: monthsAgo <= 2,
      };
    });
  } catch (err) {
    console.error("[customers-repo] DB read failed:", err);
    return [];
  }
}
