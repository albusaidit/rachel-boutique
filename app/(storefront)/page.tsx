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

const newArrivals = products.filter((p) => p.tags.includes("new")).map((p) => p.id);
const bestsellers = products.filter((p) => p.tags.includes("bestseller")).map((p) => p.id);
const perfumeHighlights = products.filter((p) => p.category === "perfumes").map((p) => p.id);
const beautyHighlights = products.filter((p) => p.category === "beauty").map((p) => p.id);

export default function BoutiquePage() {
  return (
    <div id="top">
      <Header />
      <BrandReveal />
      <HeroSlider />
      <Marquee />
      <CategoryBanners />
      <ProductGrid section="new" ids={newArrivals} />
      <Story />
      <ProductGrid section="bestsellers" ids={bestsellers} />
      <ProductGrid section="perfumes" ids={perfumeHighlights} />
      <ProductGrid section="beauty" ids={beautyHighlights} />
      <Footer />
      <CartDrawer />
    </div>
  );
}
