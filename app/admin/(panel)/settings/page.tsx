import { loadSettings } from "@/app/_lib/db/settings-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { SettingsView } from "../../_components/SettingsView";

export default async function AdminSettingsPage() {
  const settings = await loadSettings();
  return <SettingsView settings={settings} dbReady={isDbConfigured()} />;
}
