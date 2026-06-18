"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import { getCurrentUser, isAuthed } from "@/app/admin/_lib/auth";
import { logAuditEvent, type Actor } from "./audit-repo";

async function currentActor(): Promise<Actor> {
  const u = await getCurrentUser();
  if (!u) return { id: null, username: null, role: null };
  return { id: u.id, username: u.username, role: u.role };
}

async function snapshotProduct(id: string) {
  const rows = await getDb()
    .select({
      id: schema.products.id,
      nameEn: schema.products.nameEn,
      nameAr: schema.products.nameAr,
      price: schema.products.price,
      compareAt: schema.products.compareAt,
      stock: schema.products.stock,
      category: schema.products.category,
      subcategory: schema.products.subcategory,
      tags: schema.products.tags,
      images: schema.products.images,
      archivedAt: schema.products.archivedAt,
    })
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  return rows[0] ?? null;
}

async function ensureAuth() {
  if (!(await isAuthed())) {
    throw new Error("unauthorized");
  }
}

function ensureDb() {
  if (!isDbConfigured()) {
    throw new Error("Database not configured");
  }
}

function getStr(formData: FormData, key: string): string {
  return formData.get(key)?.toString().trim() ?? "";
}

function getNum(formData: FormData, key: string): number | null {
  const raw = formData.get(key)?.toString().trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getList(formData: FormData, key: string): string[] {
  return getStr(formData, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateProductAction(id: string, formData: FormData) {
  await ensureAuth();
  ensureDb();
  const images = formData
    .getAll("images[]")
    .map((v) => v.toString().trim())
    .filter(Boolean);
  const colorNames = formData.getAll("colorName[]").map((v) => v.toString());
  const colorHexes = formData.getAll("colorHex[]").map((v) => v.toString());
  const colors = colorNames
    .map((name, i) => ({ name: name.trim(), hex: (colorHexes[i] ?? "").trim() }))
    .filter((c) => c.name);
  const category = getStr(formData, "category");
  const subcategory = getStr(formData, "subcategory");
  const update: Partial<typeof schema.products.$inferInsert> = {
    nameEn: getStr(formData, "nameEn"),
    nameAr: getStr(formData, "nameAr"),
    nameFr: getStr(formData, "nameFr") || null,
    descEn: getStr(formData, "descEn"),
    descAr: getStr(formData, "descAr"),
    descFr: getStr(formData, "descFr") || null,
    price: getNum(formData, "price") ?? 0,
    compareAt: getNum(formData, "compareAt"),
    stock: getNum(formData, "stock") ?? 0,
    sizes: getList(formData, "sizes"),
    tags: getList(formData, "tags"),
    colors,
    images,
    ...(category ? { category } : {}),
    ...(subcategory ? { subcategory } : {}),
    updatedAt: new Date(),
  };
  const actor = await currentActor();
  const before = await snapshotProduct(id);
  await getDb().update(schema.products).set(update).where(eq(schema.products.id, id));
  void logAuditEvent({
    actor,
    action: "product.updated",
    targetType: "product",
    targetId: id,
    before,
    after: { ...before, ...update },
  });
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
}

export async function createProductAction(formData: FormData) {
  await ensureAuth();
  ensureDb();
  const id = getStr(formData, "id");
  const slug = getStr(formData, "slug");
  const nameEn = getStr(formData, "nameEn");
  const nameAr = getStr(formData, "nameAr");
  const descEn = getStr(formData, "descEn");
  const descAr = getStr(formData, "descAr");
  const category = getStr(formData, "category");
  const subcategory = getStr(formData, "subcategory");

  if (!id || !slug || !nameEn || !nameAr || !descEn || !descAr || !category || !subcategory) {
    throw new Error("Missing required fields");
  }
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error("ID must be lowercase letters, digits or hyphens");
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Slug must be lowercase letters, digits or hyphens");
  }

  const existing = await getDb()
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (existing.length > 0) throw new Error("A product with this ID already exists");

  const images = formData
    .getAll("images[]")
    .map((v) => v.toString().trim())
    .filter(Boolean);

  const actor = await currentActor();
  await getDb().insert(schema.products).values({
    id,
    slug,
    nameEn,
    nameAr,
    nameFr: getStr(formData, "nameFr") || null,
    descEn,
    descAr,
    descFr: getStr(formData, "descFr") || null,
    price: getNum(formData, "price") ?? 0,
    compareAt: getNum(formData, "compareAt"),
    currency: getStr(formData, "currency") || "MAD",
    stock: getNum(formData, "stock") ?? 0,
    sizes: getList(formData, "sizes"),
    tags: getList(formData, "tags"),
    colors: [],
    images,
    category,
    subcategory,
  });

  void logAuditEvent({
    actor,
    action: "product.created",
    targetType: "product",
    targetId: id,
    after: { nameEn, nameAr, price: getNum(formData, "price") ?? 0, category, subcategory },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
  return { id };
}

export async function adjustStockAction(id: string, delta: number) {
  await ensureAuth();
  ensureDb();
  const actor = await currentActor();
  const rows = await getDb()
    .select({ stock: schema.products.stock })
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (rows.length === 0) throw new Error("product not found");
  const before = rows[0].stock;
  const next = Math.max(0, before + delta);
  await getDb()
    .update(schema.products)
    .set({ stock: next, updatedAt: new Date() })
    .where(eq(schema.products.id, id));
  void logAuditEvent({
    actor,
    action: "product.stock_adjusted",
    targetType: "product",
    targetId: id,
    before: { stock: before },
    after: { stock: next },
    metadata: { delta },
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
}

export async function deleteProductAction(id: string) {
  await ensureAuth();
  ensureDb();
  const actor = await currentActor();
  const before = await snapshotProduct(id);
  const now = new Date();
  await getDb()
    .update(schema.products)
    .set({ deletedAt: now, deletedBy: actor.id, updatedAt: now })
    .where(eq(schema.products.id, id));
  void logAuditEvent({
    actor,
    action: "product.deleted",
    targetType: "product",
    targetId: id,
    before,
    after: null,
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
}

export async function restoreProductAction(id: string) {
  await ensureAuth();
  ensureDb();
  const actor = await currentActor();
  if (actor.role === "fulfillment") throw new Error("forbidden");
  await getDb()
    .update(schema.products)
    .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
    .where(eq(schema.products.id, id));
  void logAuditEvent({
    actor,
    action: "product.restored",
    targetType: "product",
    targetId: id,
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
}

export async function bulkDeleteProductsAction(ids: string[]) {
  await ensureAuth();
  ensureDb();
  if (ids.length === 0) return { count: 0 };
  const actor = await currentActor();
  const { inArray } = await import("drizzle-orm");
  const now = new Date();
  await getDb()
    .update(schema.products)
    .set({ deletedAt: now, deletedBy: actor.id, updatedAt: now })
    .where(inArray(schema.products.id, ids));
  void logAuditEvent({
    actor,
    action: "product.bulk_deleted",
    targetType: "product",
    targetId: ids.join(","),
    metadata: { count: ids.length, ids },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
  return { count: ids.length };
}

export type ProductPatch = {
  nameEn?: string;
  nameAr?: string;
  nameFr?: string | null;
  price?: number;
  stock?: number;
  compareAt?: number | null;
  category?: string;
  subcategory?: string;
  tags?: string[];
};

function buildProductUpdate(patch: ProductPatch): Partial<typeof schema.products.$inferInsert> {
  const update: Partial<typeof schema.products.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof patch.nameEn === "string" && patch.nameEn.trim()) update.nameEn = patch.nameEn.trim();
  if (typeof patch.nameAr === "string" && patch.nameAr.trim()) update.nameAr = patch.nameAr.trim();
  if (patch.nameFr === null) update.nameFr = null;
  else if (typeof patch.nameFr === "string") update.nameFr = patch.nameFr.trim() || null;
  if (typeof patch.price === "number" && Number.isFinite(patch.price)) {
    update.price = Math.max(0, Math.floor(patch.price));
  }
  if (typeof patch.stock === "number" && Number.isFinite(patch.stock)) {
    update.stock = Math.max(0, Math.floor(patch.stock));
  }
  if (patch.compareAt === null) {
    update.compareAt = null;
  } else if (typeof patch.compareAt === "number" && Number.isFinite(patch.compareAt)) {
    update.compareAt = Math.max(0, Math.floor(patch.compareAt));
  }
  if (typeof patch.category === "string" && patch.category.trim()) update.category = patch.category.trim();
  if (typeof patch.subcategory === "string" && patch.subcategory.trim()) update.subcategory = patch.subcategory.trim();
  if (Array.isArray(patch.tags)) update.tags = patch.tags.map((t) => String(t).trim()).filter(Boolean);
  return update;
}

export async function quickUpdateProductAction(id: string, patch: ProductPatch) {
  await ensureAuth();
  ensureDb();
  const actor = await currentActor();
  const before = await snapshotProduct(id);
  const update = buildProductUpdate(patch);
  await getDb().update(schema.products).set(update).where(eq(schema.products.id, id));
  void logAuditEvent({
    actor,
    action: "product.quick_updated",
    targetType: "product",
    targetId: id,
    before,
    after: { ...before, ...update },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
  return { ok: true };
}

export async function saveHomepageContentAction(content: unknown) {
  await ensureAuth();
  ensureDb();
  const { saveHomepageContent } = await import("./homepage-content");
  await saveHomepageContent(content as never);
  revalidatePath("/");
  revalidatePath("/admin/homepage/content");
  revalidatePath("/admin/homepage");
  return { ok: true };
}

export async function saveHomepageLayoutAction(
  layout: Array<{ key: string; visible: boolean }>,
) {
  await ensureAuth();
  ensureDb();
  const { saveHomepageLayout } = await import("./homepage-layout");
  await saveHomepageLayout(
    layout.map((s) => ({
      key: s.key as never,
      visible: s.visible !== false,
    })),
  );
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true };
}

function rowFromSheetObj(raw: Record<string, unknown>): ImportProductRow {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const lookup: Record<string, unknown> = {};
  for (const k of Object.keys(raw)) lookup[norm(k)] = raw[k];
  const get = (k: string) => lookup[norm(k)];
  const asNum = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[, ]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };
  const asNumOrNull = (v: unknown): number | null | undefined => {
    if (v === null || v === "" || v === "—") return null;
    return asNum(v);
  };
  const asStr = (v: unknown): string | undefined => {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    return s || undefined;
  };
  const splitList = (v: unknown): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    const s = String(v).trim();
    if (!s) return [];
    const splitter = s.includes("|") ? "|" : ",";
    return s
      .split(splitter)
      .map((p) => p.trim())
      .filter(Boolean);
  };
  return {
    id: String(get("id") ?? "").trim().toLowerCase(),
    slug: asStr(get("slug")),
    nameEn: asStr(get("nameEn")),
    nameAr: asStr(get("nameAr")),
    nameFr: asStr(get("nameFr")) ?? null,
    descEn: asStr(get("descEn")),
    descAr: asStr(get("descAr")),
    descFr: asStr(get("descFr")) ?? null,
    price: asNum(get("price")),
    compareAt: asNumOrNull(get("compareAt")),
    stock: asNum(get("stock")),
    category: asStr(get("category")),
    subcategory: asStr(get("subcategory")),
    sizes: splitList(get("sizes")),
    tags: splitList(get("tags")),
    images: splitList(get("images")),
  };
}

export async function syncFromGoogleSheetsAction(): Promise<
  | {
      ok: true;
      created: number;
      updated: number;
      errors: number;
      total: number;
      sheetId: string;
      serviceAccount: string;
      tabName: string;
    }
  | { ok: false; error: string }
> {
  await ensureAuth();
  ensureDb();
  const { isSheetsConfigured, readSheetRows } = await import(
    "@/app/_lib/google-sheets/client"
  );
  if (!isSheetsConfigured()) {
    return { ok: false, error: "sheets_not_configured" };
  }
  let read;
  try {
    read = await readSheetRows();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "sheet_read_failed",
    };
  }
  if (read.rows.length === 0) {
    return {
      ok: true,
      created: 0,
      updated: 0,
      errors: 0,
      total: 0,
      sheetId: read.sheetId,
      serviceAccount: read.serviceAccount,
      tabName: read.tabName,
    };
  }
  const importRows = read.rows.map((r) => rowFromSheetObj(r));
  const result = await bulkImportProductsAction(importRows);

  // Persist last sync info into the settings table for the UI badge.
  try {
    const now = new Date();
    const value = JSON.stringify({
      at: now.toISOString(),
      created: result.created,
      updated: result.updated,
      errors: result.errors,
      total: importRows.length,
    });
    await getDb()
      .insert(schema.settings)
      .values({ key: "sheets_last_sync", value })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedAt: now },
      });
  } catch {
    // ignore — sync result still returned
  }

  revalidatePath("/admin/products/import");
  return {
    ok: true,
    created: result.created,
    updated: result.updated,
    errors: result.errors,
    total: importRows.length,
    sheetId: read.sheetId,
    serviceAccount: read.serviceAccount,
    tabName: read.tabName,
  };
}

export async function getLastSheetsSyncAction(): Promise<{
  at: string;
  created: number;
  updated: number;
  errors: number;
  total: number;
} | null> {
  await ensureAuth();
  if (!isDbConfigured()) return null;
  try {
    const rows = await getDb()
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, "sheets_last_sync"))
      .limit(1);
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].value);
  } catch {
    return null;
  }
}

export type ImportProductRow = {
  id: string;
  slug?: string;
  nameEn?: string;
  nameAr?: string;
  nameFr?: string | null;
  descEn?: string;
  descAr?: string;
  descFr?: string | null;
  price?: number;
  compareAt?: number | null;
  stock?: number;
  category?: string;
  subcategory?: string;
  sizes?: string[];
  tags?: string[];
  images?: string[];
};

export type ImportRowResult = {
  rowNumber: number;
  id: string;
  status: "created" | "updated" | "skipped" | "error";
  error?: string;
};

export async function bulkImportProductsAction(
  rows: ImportProductRow[],
): Promise<{ created: number; updated: number; errors: number; results: ImportRowResult[] }> {
  await ensureAuth();
  ensureDb();
  const db = getDb();
  const results: ImportRowResult[] = [];
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 2; // header is row 1
    const id = (row.id ?? "").trim();
    if (!id) {
      errors += 1;
      results.push({ rowNumber, id: "", status: "error", error: "Missing id" });
      continue;
    }
    if (!/^[a-z0-9-]+$/.test(id)) {
      errors += 1;
      results.push({ rowNumber, id, status: "error", error: "ID must be lowercase letters/digits/hyphens" });
      continue;
    }

    const existing = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    if (existing.length > 0 && existing[0].deletedAt) {
      // Row was soft-deleted by an admin — don't resurrect via import.
      // Admin must explicitly restore from /admin/audit.
      results.push({
        rowNumber,
        id,
        status: "skipped",
        error: "soft-deleted — restore from audit first",
      });
      continue;
    }

    if (existing.length === 0) {
      // CREATE — need full required fields
      const slug = (row.slug ?? "").trim() || id;
      const nameEn = (row.nameEn ?? "").trim();
      const nameAr = (row.nameAr ?? "").trim();
      const descEn = (row.descEn ?? "").trim() || nameEn;
      const descAr = (row.descAr ?? "").trim() || nameAr;
      const category = (row.category ?? "").trim();
      const subcategory = (row.subcategory ?? "").trim();
      if (!nameEn || !nameAr || !category || !subcategory) {
        errors += 1;
        results.push({
          rowNumber,
          id,
          status: "error",
          error: "New rows require nameEn, nameAr, category, subcategory",
        });
        continue;
      }
      try {
        await db.insert(schema.products).values({
          id,
          slug,
          nameEn,
          nameAr,
          nameFr: row.nameFr?.trim() || null,
          descEn,
          descAr,
          descFr: row.descFr?.trim() || null,
          price: Math.max(0, Math.floor(row.price ?? 0)),
          compareAt:
            typeof row.compareAt === "number" && Number.isFinite(row.compareAt)
              ? Math.max(0, Math.floor(row.compareAt))
              : null,
          currency: "MAD",
          stock: Math.max(0, Math.floor(row.stock ?? 0)),
          sizes: row.sizes ?? [],
          tags: row.tags ?? [],
          colors: [],
          images: row.images ?? [],
          category,
          subcategory,
        });
        created += 1;
        results.push({ rowNumber, id, status: "created" });
      } catch (err) {
        errors += 1;
        results.push({
          rowNumber,
          id,
          status: "error",
          error: err instanceof Error ? err.message : "insert failed",
        });
      }
    } else {
      // UPDATE — only fields the user provided
      const update: Partial<typeof schema.products.$inferInsert> = { updatedAt: new Date() };
      if (row.slug !== undefined && row.slug.trim()) update.slug = row.slug.trim();
      if (row.nameEn !== undefined && row.nameEn.trim()) update.nameEn = row.nameEn.trim();
      if (row.nameAr !== undefined && row.nameAr.trim()) update.nameAr = row.nameAr.trim();
      if (row.nameFr !== undefined) update.nameFr = row.nameFr?.trim() || null;
      if (row.descEn !== undefined && row.descEn.trim()) update.descEn = row.descEn.trim();
      if (row.descAr !== undefined && row.descAr.trim()) update.descAr = row.descAr.trim();
      if (row.descFr !== undefined) update.descFr = row.descFr?.trim() || null;
      if (typeof row.price === "number" && Number.isFinite(row.price)) {
        update.price = Math.max(0, Math.floor(row.price));
      }
      if (row.compareAt === null) update.compareAt = null;
      else if (typeof row.compareAt === "number" && Number.isFinite(row.compareAt)) {
        update.compareAt = Math.max(0, Math.floor(row.compareAt));
      }
      if (typeof row.stock === "number" && Number.isFinite(row.stock)) {
        update.stock = Math.max(0, Math.floor(row.stock));
      }
      if (Array.isArray(row.sizes)) update.sizes = row.sizes;
      if (Array.isArray(row.tags)) update.tags = row.tags;
      // images, category & subcategory are admin-managed — never overwrite them
      // from the sheet on update, or admin edits revert on the next import.
      // (New products still take them from the sheet on create above.)
      const hasUpdate = Object.keys(update).length > 1; // updatedAt always present
      if (!hasUpdate) {
        results.push({ rowNumber, id, status: "skipped" });
        continue;
      }
      try {
        await db.update(schema.products).set(update).where(eq(schema.products.id, id));
        updated += 1;
        results.push({ rowNumber, id, status: "updated" });
      } catch (err) {
        errors += 1;
        results.push({
          rowNumber,
          id,
          status: "error",
          error: err instanceof Error ? err.message : "update failed",
        });
      }
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/bulk");
  revalidatePath("/admin/products/order");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");

  return { created, updated, errors, results };
}

export async function reorderProductsAction(orderedIds: string[]) {
  await ensureAuth();
  ensureDb();
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { count: 0 };
  const actor = await currentActor();
  const db = getDb();
  for (let i = 0; i < orderedIds.length; i += 1) {
    await db
      .update(schema.products)
      .set({ displayOrder: i, updatedAt: new Date() })
      .where(eq(schema.products.id, orderedIds[i]));
  }
  void logAuditEvent({
    actor,
    action: "product.reordered",
    targetType: "product",
    targetId: orderedIds.join(","),
    metadata: { count: orderedIds.length },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/order");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
  return { count: orderedIds.length };
}

export async function bulkUpdateProductsAction(
  patches: Array<{ id: string; patch: ProductPatch }>,
) {
  await ensureAuth();
  ensureDb();
  if (patches.length === 0) return { count: 0 };
  const db = getDb();
  let count = 0;
  for (const { id, patch } of patches) {
    const update = buildProductUpdate(patch);
    if (Object.keys(update).length <= 1) continue;
    await db.update(schema.products).set(update).where(eq(schema.products.id, id));
    count += 1;
  }
  const actor = await currentActor();
  void logAuditEvent({
    actor,
    action: "product.bulk_updated",
    targetType: "product",
    targetId: patches.map((p) => p.id).join(","),
    metadata: { count, ids: patches.map((p) => p.id) },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/bulk");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
  return { count };
}

export async function duplicateProductAction(id: string) {
  await ensureAuth();
  ensureDb();
  const rows = await getDb()
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (rows.length === 0) throw new Error("product not found");
  const src = rows[0];

  let newId = `${src.id}-copy`;
  let newSlug = `${src.slug}-copy`;
  let i = 1;
  while (true) {
    const existing = await getDb()
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, newId))
      .limit(1);
    if (existing.length === 0) break;
    i += 1;
    newId = `${src.id}-copy-${i}`;
    newSlug = `${src.slug}-copy-${i}`;
  }

  await getDb().insert(schema.products).values({
    ...src,
    id: newId,
    slug: newSlug,
    nameEn: `${src.nameEn} (copy)`,
    nameAr: `${src.nameAr} (نسخة)`,
    nameFr: src.nameFr ? `${src.nameFr} (copie)` : null,
    archivedAt: null,
    stock: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const actor = await currentActor();
  void logAuditEvent({
    actor,
    action: "product.duplicated",
    targetType: "product",
    targetId: newId,
    metadata: { from: id },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  return { id: newId };
}

export async function archiveProductAction(id: string, archive: boolean) {
  await ensureAuth();
  ensureDb();
  const actor = await currentActor();
  await getDb()
    .update(schema.products)
    .set({ archivedAt: archive ? new Date() : null, updatedAt: new Date() })
    .where(eq(schema.products.id, id));
  void logAuditEvent({
    actor,
    action: archive ? "product.archived" : "product.unarchived",
    targetType: "product",
    targetId: id,
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
}

export async function bulkArchiveProductsAction(ids: string[], archive: boolean) {
  await ensureAuth();
  ensureDb();
  if (ids.length === 0) return { count: 0 };
  const actor = await currentActor();
  const { inArray } = await import("drizzle-orm");
  await getDb()
    .update(schema.products)
    .set({ archivedAt: archive ? new Date() : null, updatedAt: new Date() })
    .where(inArray(schema.products.id, ids));
  void logAuditEvent({
    actor,
    action: "product.bulk_archived",
    targetType: "product",
    targetId: ids.join(","),
    metadata: { count: ids.length, archive, ids },
  });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  revalidatePath("/");
  return { count: ids.length };
}

export async function updateSettingsAction(formData: FormData) {
  await ensureAuth();
  ensureDb();
  const { SETTINGS_KEYS } = await import("./settings-repo");
  for (const key of SETTINGS_KEYS) {
    const value = formData.get(key);
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    await getDb()
      .insert(schema.settings)
      .values({ key, value: trimmed })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: trimmed, updatedAt: new Date() },
      });
  }
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
