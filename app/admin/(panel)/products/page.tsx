import { Suspense } from "react";
import { listProducts } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { requireFullAdmin } from "../../_lib/auth";
import { ProductsTable } from "../../_components/ProductsTable";

export default async function AdminProductsPage() {
  await requireFullAdmin();
  const products = await listProducts();
  const dbReady = isDbConfigured();

  const rows = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.images[0],
    category: p.category,
    price: p.price,
    compareAt: p.compareAt,
    stock: p.stock,
    tags: p.tags,
  }));

  const categories = categoryTree.map((c) => ({
    key: c.key,
    ar: c.ar,
    en: c.en,
    fr: c.fr,
  }));

  return (
    <Suspense fallback={null}>
      <ProductsTable rows={rows} categories={categories} dbReady={dbReady} />
    </Suspense>
  );
}
