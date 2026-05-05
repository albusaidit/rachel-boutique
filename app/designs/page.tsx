import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Playfair_Display,
  Inter,
  Amiri,
  Reem_Kufi,
} from "next/font/google";
import Image from "next/image";
import "./designs.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-d-cormorant" });
const kufi = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-d-kufi" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-d-naskh" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-d-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-d-inter" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-d-amiri" });
const reem = Reem_Kufi({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-d-reem" });

const fontVars = [cormorant, kufi, naskh, playfair, inter, amiri, reem].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "Design options — SR Boutique",
  description: "Five design directions to preview side-by-side.",
};

const sampleProducts = [
  { title: "عباية النخبة", img: "https://picsum.photos/seed/sr-design-1/800/1000", price: "1,240" },
  { title: "فستان الورد الطائفي", img: "https://picsum.photos/seed/sr-design-2/800/1000", price: "890" },
  { title: "عطر عود ملكي", img: "https://picsum.photos/seed/sr-design-3/800/1000", price: "2,450" },
  { title: "زيت الأرغان الفاخر", img: "https://picsum.photos/seed/sr-design-4/800/1000", price: "180" },
];

const heroImg = "https://picsum.photos/seed/sr-design-hero/1200/1500";

export default function DesignsPage() {
  return (
    <div dir="rtl" lang="ar" className={`designs-root ${fontVars}`}>
      <nav className="designs-nav">
        <a href="#d1">01 · Editorial</a>
        <a href="#d2">02 · Parisian</a>
        <a href="#d3">03 · Midnight Gold</a>
        <a href="#d4">04 · Minimal</a>
        <a href="#d5">05 · Heritage</a>
        <a href="/" style={{ marginInlineStart: 24, background: "#111", color: "#fff", borderColor: "#111" }}>
          → Current site
        </a>
      </nav>

      {/* 01 — Editorial Atelier */}
      <div className="design-label">01 — Editorial Atelier · Cormorant × Noto Kufi · Ivory & Rose-gold</div>
      <section id="d1" className="d1">
        <header className="d1-header">
          <Image src="/sr-logo.webp" alt="SR Boutique" width={140} height={52} style={{ objectFit: "contain" }} />
          <nav className="d1-header-nav">
            <span>جديد</span><span>ملابس</span><span>عطور</span><span>جمال</span><span>حكايتنا</span>
          </nav>
        </header>
        <div className="d1-hero">
          <div>
            <span className="d1-eyebrow">COLLECTION №01 · SPRING 2026</span>
            <h1 className="d1-title">أناقة<br/><em>استثنائية.</em></h1>
            <p className="d1-sub">من الأزياء إلى العطور، مجموعة مختارة بعناية للمرأة التي تعرف ما تريد — وتأبى أن تتكرّر.</p>
          </div>
          <div className="d1-hero-img">
            <Image src={heroImg} alt="" width={800} height={1000} />
          </div>
        </div>
        <div className="d1-grid">
          {sampleProducts.slice(0, 3).map((p, i) => (
            <div key={i} className="d1-card">
              <div className="d1-card-num">№ 0{i + 1}</div>
              <div className="d1-card-img">
                <Image src={p.img} alt={p.title} width={600} height={800} />
              </div>
              <div className="d1-card-title">{p.title}</div>
              <div className="d1-card-price">MAD {p.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 02 — Parisian Salon */}
      <div className="design-label">02 — Parisian Salon · Cormorant Italic × Noto Naskh · Blush & Cream</div>
      <section id="d2" className="d2">
        <header className="d2-header">
          <Image src="/sr-logo.webp" alt="SR Boutique" width={120} height={45} style={{ objectFit: "contain" }} />
          <nav className="d2-header-nav">
            <span>المجموعة</span><span>العطور</span><span>الجمال</span><span>حسابي</span>
          </nav>
        </header>
        <div className="d2-hero">
          <div className="d2-florish">· · ·</div>
          <h1 className="d2-hero-title">لمسةٌ من ورد،<br/>وحكاية من ذهب.</h1>
          <p className="d2-hero-sub">كلّ قطعة في SR Boutique تُحكى بلغة الأنوثة الهادئة — بين حرير خفيف، ورائحة وردٍ طائفي، وتفاصيل لا يلتقطها سوى من يعرف.</p>
          <a href="#" className="d2-cta">اكتشفي المجموعة</a>
        </div>
        <div className="d2-grid">
          {sampleProducts.slice(0, 3).map((p, i) => (
            <div key={i} className="d2-card">
              <div className="d2-card-circle">
                <Image src={p.img} alt={p.title} width={500} height={500} />
              </div>
              <div className="d2-card-title">{p.title}</div>
              <div className="d2-card-price">{p.price} د.م.</div>
            </div>
          ))}
        </div>
      </section>

      {/* 03 — Midnight Gold */}
      <div className="design-label">03 — Midnight Gold · Playfair × Noto Kufi · Near-black & Champagne</div>
      <section id="d3" className="d3">
        <header className="d3-header">
          <div className="d3-logo">SR · BOUTIQUE</div>
          <nav className="d3-header-nav">
            <span>NEW</span><span>COUTURE</span><span>PARFUM</span><span>BEAUTÉ</span>
          </nav>
        </header>
        <div className="d3-hero">
          <div className="d3-hero-eyebrow">MAISON SR · ESTD. 2026</div>
          <h1 className="d3-hero-title">Quiet <span>luxury,</span><br/>loud whispers.</h1>
          <p className="d3-hero-sub">عطور لا تُنسى، قطع لا تتكرّر، وتجربة تسوّق صُمّمت على مقاس الذوق الرفيع.</p>
          <a href="#" className="d3-cta">دخول الصالون</a>
        </div>
        <div className="d3-grid">
          {sampleProducts.slice(0, 3).map((p, i) => (
            <div key={i} className="d3-card">
              <div className="d3-card-img">
                <Image src={p.img} alt={p.title} width={600} height={800} />
              </div>
              <div className="d3-card-title">{p.title}</div>
              <div className="d3-card-price">MAD {p.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 04 — Modern Minimal Boutique */}
      <div className="design-label">04 — Modern Minimal · Inter × Noto Kufi · Warm white & Terracotta</div>
      <section id="d4" className="d4">
        <header className="d4-header">
          <div className="d4-logo">SR BOUTIQUE</div>
          <nav className="d4-header-nav">
            <span>Shop</span><span>Perfumery</span><span>Beauty</span><span>Journal</span><span>EN / AR</span>
          </nav>
        </header>
        <div className="d4-hero">
          <div>
            <div className="d4-hero-num">№ 01 / SS26</div>
            <h1 className="d4-hero-title">Considered pieces.<br/>Quietly luxurious.</h1>
            <p className="d4-hero-sub">قطع منتقاة بدقة، خالية من الضوضاء، للمرأة التي تختار نوعيّة لا كميّة.</p>
            <a href="#" className="d4-cta">Browse the edit</a>
          </div>
          <div className="d4-hero-img">
            <Image src={heroImg} alt="" width={800} height={800} />
          </div>
        </div>
        <div className="d4-divider">
          <div className="d4-divider-line">
            <span className="d4-divider-label">The Edit · 04</span>
          </div>
        </div>
        <div className="d4-grid">
          {sampleProducts.map((p, i) => (
            <div key={i} className="d4-card">
              <div className="d4-card-img">
                <Image src={p.img} alt={p.title} width={600} height={800} />
              </div>
              <div className="d4-card-meta">Clothing · 0{i + 1}</div>
              <div className="d4-card-title">{p.title}</div>
              <div className="d4-card-price">MAD {p.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — Heritage Mashrabiya */}
      <div className="design-label">05 — Heritage Mashrabiya · Amiri × Reem Kufi · Sand, Brown & Turquoise</div>
      <section id="d5" className="d5">
        <header className="d5-header">
          <div className="d5-logo">SR · بوتيك الأناقة</div>
          <nav className="d5-header-nav">
            <span>الأزياء</span><span>العطور</span><span>الجمال</span><span>عن البيت</span>
          </nav>
        </header>
        <div className="d5-hero">
          <h1 className="d5-hero-title">تراثٌ يُلبَس،<br/>وحكاية <span className="accent">تُروى.</span></h1>
          <p className="d5-hero-sub">بين العود الكمبودي، والورد الطائفي، والمخاوير الإماراتية — نُقدّم لكِ رفاهية الشرق بلمسة معاصرة.</p>
          <a href="#" className="d5-cta">ادخلي البيت</a>
        </div>
        <div className="d5-pattern">
          <div className="d5-pattern-line" />
          <div className="d5-pattern-sym">۞</div>
          <div className="d5-pattern-line" />
        </div>
        <div className="d5-grid">
          {sampleProducts.slice(0, 3).map((p, i) => (
            <div key={i} className="d5-card">
              <div className="d5-card-img">
                <Image src={p.img} alt={p.title} width={600} height={800} />
              </div>
              <div className="d5-card-title">{p.title}</div>
              <div className="d5-card-en">SR BOUTIQUE · № 0{i + 1}</div>
              <div className="d5-card-price">{p.price} د.م.</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
