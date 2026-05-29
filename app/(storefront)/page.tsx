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
import { getHomepageLayout, type SectionKey } from "@/app/_lib/db/homepage-layout";

const newArrivals = products.filter((p) => p.tags.includes("new")).map((p) => p.id);
const bestsellers = products.filter((p) => p.tags.includes("bestseller")).map((p) => p.id);
const perfumeHighlights = products.filter((p) => p.category === "perfumes").map((p) => p.id);
const beautyHighlights = products.filter((p) => p.category === "beauty").map((p) => p.id);

function renderSection(key: SectionKey) {
  switch (key) {
    case "brand_reveal":
      return <BrandReveal key={key} />;
    case "hero":
      return <HeroSlider key={key} />;
    case "marquee":
      return <Marquee key={key} />;
    case "category_banners":
      return <CategoryBanners key={key} />;
    case "new_arrivals":
      return <ProductGrid key={key} section="new" ids={newArrivals} />;
    case "story":
      return <Story key={key} />;
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

export default async function BoutiquePage() {
  const layout = await getHomepageLayout();
  return (
    <div id="top">
      <Header />
      {layout.filter((s) => s.visible).map((s) => renderSection(s.key))}
      <Footer />
      <CartDrawer />
    </div>
  );
}
