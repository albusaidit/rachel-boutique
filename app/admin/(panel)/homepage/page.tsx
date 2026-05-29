import { isDbConfigured } from "@/app/_lib/db/client";
import {
  DEFAULT_LAYOUT,
  SECTION_DESCRIPTION,
  SECTION_LABEL,
  getHomepageLayout,
} from "@/app/_lib/db/homepage-layout";
import { requireFullAdmin } from "../../_lib/auth";
import { HomepageEditor } from "../../_components/HomepageEditor";

export default async function AdminHomepagePage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const layout = await getHomepageLayout();
  const sections = (dbReady ? layout : DEFAULT_LAYOUT).map((s) => ({
    key: s.key,
    visible: s.visible,
    label: SECTION_LABEL[s.key],
    description: SECTION_DESCRIPTION[s.key],
  }));
  return <HomepageEditor initialSections={sections} dbReady={dbReady} />;
}
