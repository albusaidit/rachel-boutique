import { listProducts } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { requireFullAdmin } from "../../../_lib/auth";
import { BulkEditTable } from "../../../_components/BulkEditTable";

export default async function AdminProductsBulkPage() {
  await requireFullAdmin();
  const products = await listProducts();
  const dbReady = isDbConfigured();

  const rows = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameEn: p.name.en,
    nameAr: p.name.ar,
    nameFr: p.name.fr ?? "",
    price: p.price,
    compareAt: p.compareAt ?? null,
    stock: p.stock,
    category: p.category,
    subcategory: p.subcategory,
    tags: p.tags,
    image: p.images[0] ?? "",
  }));

  const categories = categoryTree.map((c) => ({
    key: c.key,
    en: c.en,
    ar: c.ar,
    fr: c.fr,
    subcategories: c.subcategories.map((s) => ({ key: s.key, en: s.en, ar: s.ar, fr: s.fr })),
  }));

  return <BulkEditTable initialRows={rows} categories={categories} dbReady={dbReady} />;
}
