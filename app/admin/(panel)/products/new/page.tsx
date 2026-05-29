import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { requireFullAdmin } from "../../../_lib/auth";
import { ProductCreate } from "../../../_components/ProductCreate";

export default async function AdminProductNewPage() {
  await requireFullAdmin();
  const categories = categoryTree.map((c) => ({
    key: c.key,
    ar: c.ar,
    en: c.en,
    fr: c.fr,
    subcategories: c.subcategories.map((s) => ({
      key: s.key,
      ar: s.ar,
      en: s.en,
      fr: s.fr,
    })),
  }));

  return <ProductCreate categories={categories} dbReady={isDbConfigured()} />;
}
