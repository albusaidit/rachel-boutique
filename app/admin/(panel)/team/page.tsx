import { listAdminUsers } from "@/app/_lib/db/users-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { getCurrentUserId, requireFullAdmin } from "@/app/admin/_lib/auth";
import { TeamManager } from "../../_components/TeamManager";

export default async function AdminTeamPage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const users = dbReady ? await listAdminUsers() : [];
  const currentIdRaw = await getCurrentUserId();
  const currentUserId =
    currentIdRaw && currentIdRaw !== "legacy" ? Number(currentIdRaw) : null;
  return (
    <TeamManager
      users={users}
      dbReady={dbReady}
      currentUserId={Number.isFinite(currentUserId) ? currentUserId : null}
    />
  );
}
