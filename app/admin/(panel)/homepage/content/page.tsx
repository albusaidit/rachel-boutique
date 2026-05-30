import { categoryTree } from "@/app/(storefront)/_lib/products";
import { isDbConfigured } from "@/app/_lib/db/client";
import { getHomepageContent } from "@/app/_lib/db/homepage-content";
import { requireFullAdmin } from "../../../_lib/auth";
import { HomepageContentEditor } from "../../../_components/HomepageContentEditor";

export default async function AdminHomepageContentPage() {
  await requireFullAdmin();
  const dbReady = isDbConfigured();
  const content = await getHomepageContent();
  const categories = categoryTree.map((c) => ({
    key: c.key,
    en: c.en,
    ar: c.ar,
    fr: c.fr,
  }));
  return <HomepageContentEditor initialContent={content} categories={categories} dbReady={dbReady} />;
}
