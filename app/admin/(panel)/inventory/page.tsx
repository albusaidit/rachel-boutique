import { products, categoryTree } from "@/app/boutique/_lib/products";
import { InventoryView } from "../../_components/InventoryView";

export default function AdminInventoryPage() {
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
  return <InventoryView rows={rows} categories={categories} />;
}
