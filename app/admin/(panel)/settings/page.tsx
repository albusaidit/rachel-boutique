import { loadSettings } from "@/app/_lib/db/settings-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { getWhatsappStatusAction } from "@/app/_lib/db/whatsapp-actions";
import { requireFullAdmin } from "../../_lib/auth";
import { SettingsView } from "../../_components/SettingsView";
import { WhatsappConnect } from "../../_components/WhatsappConnect";

export default async function AdminSettingsPage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const [settings, waStatus] = await Promise.all([
    loadSettings(),
    getWhatsappStatusAction(),
  ]);
  return (
    <SettingsView settings={settings} dbReady={dbReady}>
      <WhatsappConnect status={waStatus} dbReady={dbReady} />
    </SettingsView>
  );
}
