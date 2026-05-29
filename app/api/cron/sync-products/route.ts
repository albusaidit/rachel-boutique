import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/app/_lib/db/client";
import {
  bulkImportProductsAction,
  type ImportProductRow,
} from "@/app/_lib/db/actions";
import {
  isSheetsConfigured,
  readSheetRows,
} from "@/app/_lib/google-sheets/client";

// External cron hits this every X minutes (cron-job.org, GitHub Actions, etc.).
// Protected with CRON_SECRET — caller must send Authorization: Bearer <secret>.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (header !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "db_not_configured" }, { status: 503 });
  }
  if (!isSheetsConfigured()) {
    return NextResponse.json({ error: "sheets_not_configured" }, { status: 503 });
  }

  let read;
  try {
    read = await readSheetRows();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "sheet_read_failed" },
      { status: 502 },
    );
  }

  if (read.rows.length === 0) {
    return NextResponse.json({ ok: true, created: 0, updated: 0, errors: 0, total: 0 });
  }

  // Reuse the same parser/import path as the admin manual import.
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
  const splitList = (v: unknown): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    const s = String(v).trim();
    if (!s) return [];
    const splitter = s.includes("|") ? "|" : ",";
    return s.split(splitter).map((p) => p.trim()).filter(Boolean);
  };
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

  const rows: ImportProductRow[] = read.rows.map((raw) => {
    const lookup: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) lookup[norm(k)] = raw[k];
    const get = (k: string) => lookup[norm(k)];
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
  });

  // Note: bulkImportProductsAction requires admin auth. Cron must bypass that.
  // Reimplement the core insert/update loop here without ensureAuth().
  // Simpler: call the DB directly with the same logic.
  const db = getDb();
  let created = 0;
  let updated = 0;
  let errors = 0;
  for (const row of rows) {
    if (!row.id || !/^[a-z0-9-]+$/.test(row.id)) {
      errors += 1;
      continue;
    }
    const existing = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, row.id))
      .limit(1);
    if (existing.length === 0) {
      const nameEn = row.nameEn?.trim();
      const nameAr = row.nameAr?.trim();
      const category = row.category?.trim();
      const subcategory = row.subcategory?.trim();
      if (!nameEn || !nameAr || !category || !subcategory) {
        errors += 1;
        continue;
      }
      try {
        await db.insert(schema.products).values({
          id: row.id,
          slug: row.slug?.trim() || row.id,
          nameEn,
          nameAr,
          nameFr: row.nameFr?.trim() || null,
          descEn: row.descEn?.trim() || nameEn,
          descAr: row.descAr?.trim() || nameAr,
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
      } catch {
        errors += 1;
      }
    } else {
      const update: Partial<typeof schema.products.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (row.slug?.trim()) update.slug = row.slug.trim();
      if (row.nameEn?.trim()) update.nameEn = row.nameEn.trim();
      if (row.nameAr?.trim()) update.nameAr = row.nameAr.trim();
      if (row.nameFr !== undefined) update.nameFr = row.nameFr?.trim() || null;
      if (row.descEn?.trim()) update.descEn = row.descEn.trim();
      if (row.descAr?.trim()) update.descAr = row.descAr.trim();
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
      if (row.category?.trim()) update.category = row.category.trim();
      if (row.subcategory?.trim()) update.subcategory = row.subcategory.trim();
      if (Array.isArray(row.sizes)) update.sizes = row.sizes;
      if (Array.isArray(row.tags)) update.tags = row.tags;
      if (Array.isArray(row.images) && row.images.length > 0) update.images = row.images;
      if (Object.keys(update).length <= 1) continue;
      try {
        await db.update(schema.products).set(update).where(eq(schema.products.id, row.id));
        updated += 1;
      } catch {
        errors += 1;
      }
    }
  }

  // Stash last sync info for the admin UI badge.
  try {
    const value = JSON.stringify({
      at: new Date().toISOString(),
      created,
      updated,
      errors,
      total: rows.length,
    });
    await getDb()
      .insert(schema.settings)
      .values({ key: "sheets_last_sync", value })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedAt: new Date() },
      });
  } catch {
    /* ignore */
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/import");
  revalidatePath("/admin/inventory");
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    created,
    updated,
    errors,
    total: rows.length,
  });
}
