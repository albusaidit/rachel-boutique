import { listAuditEvents, listDeletedOrders } from "@/app/_lib/db/audit-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { requireFullAdmin } from "../../_lib/auth";
import { AuditView } from "../../_components/AuditView";

export default async function AdminAuditPage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const [events, deleted] = await Promise.all([listAuditEvents({ limit: 200 }), listDeletedOrders()]);
  return <AuditView events={events} deleted={deleted} dbReady={dbReady} />;
}
