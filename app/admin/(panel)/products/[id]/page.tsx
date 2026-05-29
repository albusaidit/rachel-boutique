import { notFound } from "next/navigation";
import { findProductRepo } from "@/app/_lib/db/products-repo";
import { isDbConfigured } from "@/app/_lib/db/client";
import { categoryTree } from "@/app/(storefront)/_lib/products";
import { requireFullAdmin } from "../../../_lib/auth";
import { ProductDetail } from "../../../_components/ProductDetail";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFullAdmin();
  const { id } = await params;
  const product = await findProductRepo(id);
  if (!product) notFound();

  const categories = categoryTree.map((c) => ({
    key: c.key,
    ar: c.ar,
    en: c.en,
    fr: c.fr,
  }));

  return (
    <ProductDetail
      product={{
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        compareAt: product.compareAt,
        stock: product.stock,
        sizes: product.sizes,
        colors: product.colors,
        images: product.images,
        tags: product.tags,
      }}
      categories={categories}
      dbReady={isDbConfigured()}
    />
  );
}
