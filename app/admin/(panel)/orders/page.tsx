import { listOrders } from "@/app/_lib/db/orders-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { OrdersEmpty } from "../../_components/OrdersEmpty";
import { OrdersTable } from "../../_components/OrdersTable";

export default async function AdminOrdersPage() {
  if (!isDbConfigured()) return <OrdersEmpty />;
  const orders = await listOrders();
  if (orders.length === 0) return <OrdersEmpty />;
  return <OrdersTable orders={orders} />;
}
