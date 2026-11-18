import { categoryTree } from "@/app/(storefront)/_lib/products";
import { listProducts } from "@/app/_lib/db/products-repo";
import { listOrders } from "@/app/_lib/db/orders-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { getSetupStatus } from "@/app/_lib/db/setup-status";
import { requireFullAdmin } from "../_lib/auth";
import { Dashboard } from "../_components/Dashboard";

export default async function AdminDashboardPage() {
  await requireFullAdmin();
  const [products, orders, setupStatus] = await Promise.all([
    listProducts(),
    listOrders(),
    getSetupStatus(),
  ]);
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

  const productById = new Map(products.map((p) => [p.id, p]));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOf30dAgo = new Date();
  startOf30dAgo.setDate(startOf30dAgo.getDate() - 29);
  startOf30dAgo.setHours(0, 0, 0, 0);

  const orderStats = {
    today: 0,
    pending: 0,
    confirmed: 0,
    revenueToday: 0,
    revenue30d: 0,
    total: orders.length,
  };
  const revenueByDay: Record<string, number> = {};
  const soldQty: Record<string, number> = {};

  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (o.status === "pending") orderStats.pending += 1;
    if (o.status === "confirmed") orderStats.confirmed += 1;
    if (d >= startOfToday) {
      orderStats.today += 1;
      orderStats.revenueToday += o.subtotal;
    }
    if (d >= startOf30dAgo) {
      orderStats.revenue30d += o.subtotal;
      const key = d.toISOString().slice(0, 10);
      revenueByDay[key] = (revenueByDay[key] ?? 0) + o.subtotal;
      for (const it of o.items) {
        soldQty[it.productId] = (soldQty[it.productId] ?? 0) + it.qty;
      }
    }
  }

  const revenue: number[] = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(startOf30dAgo);
    day.setDate(day.getDate() + i);
    return revenueByDay[day.toISOString().slice(0, 10)] ?? 0;
  });

  const realTopProducts = Object.entries(soldQty)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, sold]) => {
      const p = productById.get(id);
      return p
        ? {
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.images[0],
            stock: p.stock,
            sold,
          }
        : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const fallbackTopProducts =
    realTopProducts.length > 0
      ? realTopProducts
      : products
          .filter((p) => p.tags.includes("bestseller"))
          .slice(0, 5)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.images[0],
            stock: p.stock,
            sold: 0,
          }));

  const lowStockList = products
    .filter((p) => p.stock > 0 && p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      image: p.images[0],
      price: p.price,
      category: p.category,
    }));

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  const pendingOrders = orders
    .filter((o) => o.status === "pending")
    .slice(0, 8)
    .map((o) => ({
      id: o.id,
      customerName: o.customerName,
      phone: o.phone,
      city: o.city,
      subtotal: o.subtotal,
      currency: o.currency,
      createdAt: o.createdAt,
      items: o.items.map((it) => ({
        name: it.name,
        size: it.size,
        color: it.color,
        qty: it.qty,
        unitPrice: it.unitPrice,
      })),
    }));

  const outOfStockList = products
    .filter((p) => p.stock === 0)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      image: p.images[0],
      price: p.price,
      category: p.category,
    }));

  const lastOrderAt = orders.reduce<string | null>(
    (latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest),
    null,
  );

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
      orderStats={orderStats}
      categories={categoryStats}
      topProducts={fallbackTopProducts}
      revenue={revenue}
      statusCounts={statusCounts}
      pendingOrders={pendingOrders}
      lowStockList={lowStockList}
      outOfStockList={outOfStockList}
      lastOrderAt={lastOrderAt}
      dbReady={isDbConfigured()}
      setupStatus={setupStatus}
    />
  );
}
