import { products, categoryTree } from "@/app/(storefront)/_lib/products";
import { ProductsTable } from "../../_components/ProductsTable";

export default function AdminProductsPage() {
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

  return <ProductsTable rows={rows} categories={categories} />;
}
