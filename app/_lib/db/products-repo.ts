import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import {
  products as staticProducts,
  type Product,
} from "@/app/(storefront)/_lib/products";

function rowToProduct(r: typeof schema.products.$inferSelect): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: { ar: r.nameAr, en: r.nameEn, ...(r.nameFr ? { fr: r.nameFr } : {}) },
    description: {
      ar: r.descAr,
      en: r.descEn,
      ...(r.descFr ? { fr: r.descFr } : {}),
    },
    price: r.price,
    ...(r.compareAt != null ? { compareAt: r.compareAt } : {}),
    currency: r.currency as Product["currency"],
    sizes: r.sizes,
    colors: r.colors,
    images: r.images,
    category: r.category as Product["category"],
    subcategory: r.subcategory as Product["subcategory"],
    tags: r.tags as Product["tags"],
    stock: r.stock,
  };
}

export async function listProducts(): Promise<Product[]> {
  if (!isDbConfigured()) return staticProducts;
  try {
    const rows = await getDb()
      .select()
      .from(schema.products)
      .orderBy(asc(schema.products.displayOrder), asc(schema.products.nameEn));
    if (rows.length === 0) return staticProducts;
    return rows.map(rowToProduct);
  } catch (err) {
    console.error("[products-repo] DB read failed, falling back to static:", err);
    return staticProducts;
  }
}

export async function findProductRepo(idOrSlug: string): Promise<Product | null> {
  if (!isDbConfigured()) {
    return staticProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null;
  }
  try {
    const byId = await getDb()
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, idOrSlug))
      .limit(1);
    if (byId.length > 0) return rowToProduct(byId[0]);
    const bySlug = await getDb()
      .select()
      .from(schema.products)
      .where(eq(schema.products.slug, idOrSlug))
      .limit(1);
    if (bySlug.length > 0) return rowToProduct(bySlug[0]);
    return null;
  } catch (err) {
    console.error("[products-repo] DB read failed, falling back to static:", err);
    return staticProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null;
  }
}
