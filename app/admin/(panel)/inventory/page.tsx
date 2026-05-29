import { listProducts } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { requireFullAdmin } from "../../_lib/auth";
import { InventoryView } from "../../_components/InventoryView";

export default async function AdminInventoryPage() {
  await requireFullAdmin();
  const products = await listProducts();
  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.images[0],
    category: p.category,
    price: p.price,
    stock: p.stock,
    sizes: p.sizes,
  }));
  const categories = categoryTree.map((c) => ({
    key: c.key,
    ar: c.ar,
    en: c.en,
    fr: c.fr,
  }));
  return <InventoryView rows={rows} categories={categories} dbReady={isDbConfigured()} />;
}
