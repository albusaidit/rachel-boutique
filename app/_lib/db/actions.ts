"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import { isAuthed } from "@/app/admin/_lib/auth";

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
    images,
    updatedAt: new Date(),
  };
  await getDb().update(schema.products).set(update).where(eq(schema.products.id, id));
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
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

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
  return { id };
}

export async function adjustStockAction(id: string, delta: number) {
  await ensureAuth();
  ensureDb();
  const rows = await getDb()
    .select({ stock: schema.products.stock })
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (rows.length === 0) throw new Error("product not found");
  const next = Math.max(0, rows[0].stock + delta);
  await getDb()
    .update(schema.products)
    .set({ stock: next, updatedAt: new Date() })
    .where(eq(schema.products.id, id));
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

export async function deleteProductAction(id: string) {
  await ensureAuth();
  ensureDb();
  await getDb().delete(schema.products).where(eq(schema.products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function bulkDeleteProductsAction(ids: string[]) {
  await ensureAuth();
  ensureDb();
  if (ids.length === 0) return { count: 0 };
  const { inArray } = await import("drizzle-orm");
  await getDb().delete(schema.products).where(inArray(schema.products.id, ids));
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
  return { count: ids.length };
}

export async function quickUpdateProductAction(
  id: string,
  patch: { price?: number; stock?: number; compareAt?: number | null },
) {
  await ensureAuth();
  ensureDb();
  const update: Partial<typeof schema.products.$inferInsert> = {
    updatedAt: new Date(),
  };
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
  await getDb().update(schema.products).set(update).where(eq(schema.products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
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

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  return { id: newId };
}

export async function archiveProductAction(id: string, archive: boolean) {
  await ensureAuth();
  ensureDb();
  await getDb()
    .update(schema.products)
    .set({ archivedAt: archive ? new Date() : null, updatedAt: new Date() })
    .where(eq(schema.products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function bulkArchiveProductsAction(ids: string[], archive: boolean) {
  await ensureAuth();
  ensureDb();
  if (ids.length === 0) return { count: 0 };
  const { inArray } = await import("drizzle-orm");
  await getDb()
    .update(schema.products)
    .set({ archivedAt: archive ? new Date() : null, updatedAt: new Date() })
    .where(inArray(schema.products.id, ids));
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
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
