import {
  listAuditEvents,
  listDeletedOrders,
  listDeletedProducts,
} from "@/app/_lib/db/audit-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { requireFullAdmin } from "../../_lib/auth";
import { AuditView } from "../../_components/AuditView";

export default async function AdminAuditPage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const [events, deletedOrders, deletedProducts] = await Promise.all([
    listAuditEvents({ limit: 300 }),
    listDeletedOrders(),
    listDeletedProducts(),
  ]);
  return (
    <AuditView
      events={events}
      deleted={deletedOrders}
      deletedProducts={deletedProducts}
      dbReady={dbReady}
    />
  );
}
