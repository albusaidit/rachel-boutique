import { listProducts } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { ProductOrderList } from "../../../_components/ProductOrderList";

export default async function AdminProductsOrderPage() {
  const products = await listProducts();
  const dbReady = isDbConfigured();

  const rows = products.map((p) => ({
    id: p.id,
    nameEn: p.name.en,
    nameAr: p.name.ar,
    price: p.price,
    stock: p.stock,
    category: p.category,
    image: p.images[0] ?? "",
  }));

  const categories = categoryTree.map((c) => ({
    key: c.key,
    en: c.en,
    ar: c.ar,
    fr: c.fr,
  }));

  return <ProductOrderList initialRows={rows} categories={categories} dbReady={dbReady} />;
}
