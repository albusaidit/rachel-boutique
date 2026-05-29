import { listProducts } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { requireFullAdmin } from "../../../_lib/auth";
import { ProductImporter } from "../../../_components/ProductImporter";

export default async function AdminProductsImportPage() {
  await requireFullAdmin();
  const products = await listProducts();
  const dbReady = isDbConfigured();

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
    subcategories: c.subcategories.map((s) => ({ key: s.key, en: s.en })),
  }));

  return <ProductImporter current={current} categories={categories} dbReady={dbReady} />;
}
