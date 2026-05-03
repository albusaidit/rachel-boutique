import { products, categoryTree } from "@/app/boutique/_lib/products";
import { Dashboard } from "../_components/Dashboard";

export default function AdminDashboardPage() {
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const onSale = products.filter((p) => p.tags.includes("sale")).length;
  const newCount = products.filter((p) => p.tags.includes("new")).length;
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const categoryStats = categoryTree.map((cat) => ({
    key: cat.key,
    en: cat.en,
    ar: cat.ar,
    fr: cat.fr,
    icon: cat.icon,
    subCount: cat.subcategories.length,
    productCount: products.filter((p) => p.category === cat.key).length,
  }));

  const topProducts = products
    .filter((p) => p.tags.includes("bestseller"))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.images[0],
      stock: p.stock,
    }));

  // Deterministic mock revenue: 30-day series seeded by product list size
  const seed = products.length * 137;
  const revenue = Array.from({ length: 30 }, (_, i) => {
    const x = (Math.sin((seed + i) * 1.7) + 1) / 2;
    const trend = 0.6 + i * 0.012;
    const dow = i % 7 < 5 ? 1 : 1.25;
    return Math.round(8000 + x * 6500 * trend * dow);
  });

  // Activity feed mock data
  const activity = [
    ...products
      .filter((p) => p.tags.includes("new"))
      .slice(0, 3)
      .map((p) => ({ kind: "added" as const, name: p.name, when: "2h" })),
    ...products
      .filter((p) => p.stock > 0 && p.stock <= 5)
      .slice(0, 3)
      .map((p) => ({ kind: "low" as const, name: p.name, qty: p.stock, when: "5h" })),
    ...products
      .filter((p) => p.tags.includes("sale"))
      .slice(0, 2)
      .map((p) => ({ kind: "sale" as const, name: p.name, when: "1d" })),
    ...products
      .filter((p) => p.tags.includes("limited"))
      .slice(0, 2)
      .map((p) => ({ kind: "limited" as const, name: p.name, when: "2d" })),
  ];

  return (
    <Dashboard
      stats={{
        productsCount: products.length,
        totalStock,
        outOfStock,
        lowStock,
        onSale,
        newCount,
        inventoryValue,
      }}
      categories={categoryStats}
      topProducts={topProducts}
      revenue={revenue}
      activity={activity}
    />
  );
}
