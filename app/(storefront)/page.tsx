import { Header } from "./_components/Header";
import { BrandReveal } from "./_components/BrandReveal";
import { HeroSlider } from "./_components/HeroSlider";
import { Marquee } from "./_components/Marquee";
import { CategoryBanners } from "./_components/CategoryBanners";
import { ProductGrid } from "./_components/ProductGrid";
import { Story } from "./_components/Story";
import { CartDrawer } from "./_components/CartDrawer";
import { Footer } from "./_components/Footer";
import { products } from "./_lib/products";
import {
  DEFAULT_LAYOUT,
  getHomepageLayout,
  type SectionEntry,
  type SectionKey,
} from "@/app/_lib/db/homepage-layout";
import { getHomepageContent, type HomepageContent } from "@/app/_lib/db/homepage-content";

const newArrivals = products.filter((p) => p.tags.includes("new")).map((p) => p.id);
const bestsellers = products.filter((p) => p.tags.includes("bestseller")).map((p) => p.id);
const perfumeHighlights = products.filter((p) => p.category === "perfumes").map((p) => p.id);
const beautyHighlights = products.filter((p) => p.category === "beauty").map((p) => p.id);

function renderSection(key: SectionKey, content: HomepageContent) {
  switch (key) {
    case "brand_reveal":
      return <BrandReveal key={key} />;
    case "hero":
      return <HeroSlider key={key} slides={content.hero} />;
    case "marquee":
      return <Marquee key={key} items={content.marquee} />;
    case "category_banners":
      return <CategoryBanners key={key} imageOverrides={content.categoryBanners} />;
    case "new_arrivals":
      return <ProductGrid key={key} section="new" ids={newArrivals} />;
    case "story":
      return <Story key={key} content={content.story} />;
    case "bestsellers":
      return <ProductGrid key={key} section="bestsellers" ids={bestsellers} />;
    case "perfumes":
      return <ProductGrid key={key} section="perfumes" ids={perfumeHighlights} />;
    case "beauty":
      return <ProductGrid key={key} section="beauty" ids={beautyHighlights} />;
    default:
      return null;
  }
}

function tryDecodePreview(raw: string | undefined): SectionEntry[] | null {
  if (!raw) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const valid = new Set(DEFAULT_LAYOUT.map((s) => s.key));
    const seen = new Set<string>();
    const out: SectionEntry[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const obj = item as { key?: unknown; visible?: unknown };
      if (typeof obj.key !== "string") continue;
      if (!valid.has(obj.key as SectionKey)) continue;
      if (seen.has(obj.key)) continue;
      seen.add(obj.key);
      out.push({ key: obj.key as SectionKey, visible: obj.visible !== false });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const previewRaw = typeof params.preview === "string" ? params.preview : undefined;
  const preview = tryDecodePreview(previewRaw);
  const [layout, content] = await Promise.all([
    preview ? Promise.resolve(preview) : getHomepageLayout(),
    getHomepageContent(),
  ]);
  return (
    <div id="top">
      <Header />
      {layout.filter((s) => s.visible).map((s) => renderSection(s.key, content))}
      <Footer />
      <CartDrawer />
    </div>
  );
}
