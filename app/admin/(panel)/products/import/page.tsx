import { listProducts } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { getSheetsConfig } from "@/app/_lib/google-sheets/client";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/app/_lib/db/client";
import { requireFullAdmin } from "../../../_lib/auth";
import { ProductImporter } from "../../../_components/ProductImporter";

async function readLastSync() {
  if (!isDbConfigured()) return null;
  try {
    const rows = await getDb()
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, "sheets_last_sync"))
      .limit(1);
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].value) as {
      at: string;
      created: number;
      updated: number;
      errors: number;
      total: number;
    };
  } catch {
    return null;
  }
}

export default async function AdminProductsImportPage() {
  await requireFullAdmin();
  const products = await listProducts();
  const dbReady = isDbConfigured();
  const sheetsCfg = getSheetsConfig();
  const lastSync = sheetsCfg ? await readLastSync() : null;

  const current = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameEn: p.name.en,
    nameAr: p.name.ar,
    nameFr: p.name.fr ?? "",
    descEn: p.description.en,
    descAr: p.description.ar,
    descFr: p.description.fr ?? "",
    price: p.price,
    compareAt: p.compareAt ?? null,
    stock: p.stock,
    category: p.category,
    subcategory: p.subcategory,
    sizes: p.sizes.join(", "),
    tags: p.tags.join(", "),
    images: p.images.join(" | "),
  }));

  const categories = categoryTree.map((c) => ({
    key: c.key,
    en: c.en,
    ar: c.ar,
    subcategories: c.subcategories.map((s) => ({ key: s.key, en: s.en, ar: s.ar, fr: s.fr })),
  }));

  return (
    <ProductImporter
      current={current}
      categories={categories}
      dbReady={dbReady}
      sheetsConfig={
        sheetsCfg
          ? {
              configured: true,
              sheetId: sheetsCfg.sheetId,
              tabName: sheetsCfg.tabName,
              serviceAccount: sheetsCfg.credentials.client_email,
              lastSync,
            }
          : { configured: false }
      }
    />
  );
}
