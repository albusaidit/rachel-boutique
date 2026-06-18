import "server-only";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";

export type AuditAction =
  | "order.created"
  | "order.status_changed"
  | "order.shipping_updated"
  | "order.deleted"
  | "order.restored"
  | "order.whatsapp_sent"
  | "order.whatsapp_received"
  | "product.created"
  | "product.updated"
  | "product.quick_updated"
  | "product.stock_adjusted"
  | "product.archived"
  | "product.unarchived"
  | "product.deleted"
  | "product.restored"
  | "product.duplicated"
  | "product.bulk_deleted"
  | "product.bulk_archived"
  | "product.bulk_updated"
  | "product.imported"
  | "product.reordered"
  | "settings.whatsapp_updated";

export type AuditEntry = {
  id: number;
  actorId: number | null;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
};

export type Actor = {
  id: number | null;
  username: string | null;
  role: string | null;
};

export async function logAuditEvent(args: {
  actor: Actor;
  action: AuditAction;
  targetType: "order" | "product" | "settings";
  targetId: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await getDb().insert(schema.auditEvents).values({
      actorId: args.actor.id,
      actorUsername: args.actor.username,
      actorRole: args.actor.role,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      before: args.before ?? null,
      after: args.after ?? null,
      metadata: args.metadata ?? null,
    });
  } catch {
    // never let audit failures break the underlying mutation
  }
}

function rowToEntry(r: typeof schema.auditEvents.$inferSelect): AuditEntry {
  return {
    id: r.id,
    actorId: r.actorId ?? null,
    actorUsername: r.actorUsername ?? null,
    actorRole: r.actorRole ?? null,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    before: r.before,
    after: r.after,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listAuditEvents(opts?: {
  limit?: number;
  actorUsername?: string | null;
  action?: string | null;
}): Promise<AuditEntry[]> {
  if (!isDbConfigured()) return [];
  try {
    const limit = Math.max(1, Math.min(500, opts?.limit ?? 200));
    const whereParts = [] as ReturnType<typeof eq>[];
    if (opts?.actorUsername) {
      whereParts.push(eq(schema.auditEvents.actorUsername, opts.actorUsername));
    }
    if (opts?.action) {
      whereParts.push(eq(schema.auditEvents.action, opts.action));
    }
    const builder = getDb()
      .select()
      .from(schema.auditEvents)
      .orderBy(desc(schema.auditEvents.createdAt))
      .limit(limit);
    const rows =
      whereParts.length === 0
        ? await builder
        : await builder.where(whereParts.length === 1 ? whereParts[0] : and(...whereParts));
    return rows.map(rowToEntry);
  } catch {
    return [];
  }
}

export type DeletedOrderSummary = {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  status: string;
  subtotal: number;
  currency: string;
  itemCount: number;
  deletedAt: string;
  deletedBy: number | null;
  deletedByUsername: string | null;
};

export async function listDeletedOrders(): Promise<DeletedOrderSummary[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select({
        id: schema.orders.id,
        customerName: schema.orders.customerName,
        phone: schema.orders.phone,
        city: schema.orders.city,
        status: schema.orders.status,
        subtotal: schema.orders.subtotal,
        currency: schema.orders.currency,
        items: schema.orders.items,
        deletedAt: schema.orders.deletedAt,
        deletedBy: schema.orders.deletedBy,
        deletedByUsername: schema.adminUsers.username,
      })
      .from(schema.orders)
      .leftJoin(schema.adminUsers, eq(schema.orders.deletedBy, schema.adminUsers.id))
      .where(isNotNull(schema.orders.deletedAt))
      .orderBy(desc(schema.orders.deletedAt));
    return rows.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      phone: r.phone,
      city: r.city,
      status: r.status,
      subtotal: r.subtotal,
      currency: r.currency,
      itemCount: Array.isArray(r.items) ? r.items.length : 0,
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : "",
      deletedBy: r.deletedBy ?? null,
      deletedByUsername: r.deletedByUsername ?? null,
    }));
  } catch {
    return [];
  }
}

export type DeletedProductSummary = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  price: number;
  currency: string;
  stock: number;
  category: string;
  image: string | null;
  deletedAt: string;
  deletedBy: number | null;
  deletedByUsername: string | null;
};

export async function listDeletedProducts(): Promise<DeletedProductSummary[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        nameEn: schema.products.nameEn,
        nameAr: schema.products.nameAr,
        price: schema.products.price,
        currency: schema.products.currency,
        stock: schema.products.stock,
        category: schema.products.category,
        images: schema.products.images,
        deletedAt: schema.products.deletedAt,
        deletedBy: schema.products.deletedBy,
        deletedByUsername: schema.adminUsers.username,
      })
      .from(schema.products)
      .leftJoin(schema.adminUsers, eq(schema.products.deletedBy, schema.adminUsers.id))
      .where(isNotNull(schema.products.deletedAt))
      .orderBy(desc(schema.products.deletedAt));
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      nameEn: r.nameEn,
      nameAr: r.nameAr,
      price: r.price,
      currency: r.currency,
      stock: r.stock,
      category: r.category,
      image: Array.isArray(r.images) && r.images[0] ? r.images[0] : null,
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : "",
      deletedBy: r.deletedBy ?? null,
      deletedByUsername: r.deletedByUsername ?? null,
    }));
  } catch {
    return [];
  }
}

export async function countDeletedOrders(): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    const rows = await getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.orders)
      .where(isNotNull(schema.orders.deletedAt));
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}
