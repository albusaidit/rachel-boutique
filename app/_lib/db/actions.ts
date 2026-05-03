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
    updatedAt: new Date(),
  };
  await getDb().update(schema.products).set(update).where(eq(schema.products.id, id));
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
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
