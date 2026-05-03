export type CategoryKey =
  | "clothing"
  | "shoes"
  | "hair-tools"
  | "beauty"
  | "perfumes";

export type SubCategoryKey =
  | "tunics" | "blouses" | "shirts" | "abayas" | "pants"
  | "skirts" | "trench" | "coats" | "mukhawar" | "swimwear"
  | "shoes-women" | "sneakers" | "heels" | "sandals" | "boots" | "slippers"
  | "hair-dryer" | "straightener" | "curler"
  | "hair-products" | "oils" | "shea-butter" | "indian"
  | "oud" | "musk" | "attar" | "floral";

export type Locale = "ar" | "en" | "fr";
export type LocalizedField = { ar: string; en: string; fr?: string };

export type Category = {
  key: CategoryKey;
  ar: string;
  en: string;
  fr: string;
  icon: string;
  heroImage: string;
  subcategories: { key: SubCategoryKey; ar: string; en: string; fr: string }[];
};

export const categoryTree: Category[] = [
  {
    key: "clothing",
    ar: "ملابس",
    en: "Clothing",
    fr: "Vêtements",
    icon: "👗",
    heroImage: "https://picsum.photos/seed/sr-cat-clothing/900/900",
    subcategories: [
      { key: "tunics", ar: "تونيكات", en: "Tunics", fr: "Tuniques" },
      { key: "blouses", ar: "بلوزات", en: "Blouses", fr: "Blouses" },
      { key: "shirts", ar: "قمصان", en: "Shirts", fr: "Chemises" },
      { key: "abayas", ar: "عبايات", en: "Abayas", fr: "Abayas" },
      { key: "pants", ar: "بناطيل", en: "Pants", fr: "Pantalons" },
      { key: "skirts", ar: "تنانير", en: "Skirts", fr: "Jupes" },
      { key: "trench", ar: "ترانشات", en: "Trench Coats", fr: "Trench-coats" },
      { key: "coats", ar: "معاطف", en: "Coats", fr: "Manteaux" },
      { key: "mukhawar", ar: "مخاوير إماراتية", en: "Mukhawar", fr: "Mukhawar émirati" },
      { key: "swimwear", ar: "ملابس السباحة", en: "Swimwear", fr: "Maillots de bain" },
    ],
  },
  {
    key: "shoes",
    ar: "أحذية",
    en: "Shoes",
    fr: "Chaussures",
    icon: "👠",
    heroImage: "https://picsum.photos/seed/sr-cat-shoes/900/900",
    subcategories: [
      { key: "shoes-women", ar: "أحذية نسائية", en: "Women's Shoes", fr: "Pour femmes" },
      { key: "sneakers", ar: "أحذية رياضية", en: "Sneakers", fr: "Baskets" },
      { key: "heels", ar: "أحذية بكعب عالي", en: "Heels", fr: "Talons" },
      { key: "sandals", ar: "صنادل", en: "Sandals", fr: "Sandales" },
      { key: "boots", ar: "بوت", en: "Boots", fr: "Bottes" },
      { key: "slippers", ar: "بابوج / شباشب", en: "Slippers", fr: "Mules" },
    ],
  },
  {
    key: "hair-tools",
    ar: "آلات الشعر",
    en: "Hair Tools",
    fr: "Outils capillaires",
    icon: "💇‍♀️",
    heroImage: "https://picsum.photos/seed/sr-cat-hair-tools/900/900",
    subcategories: [
      { key: "hair-dryer", ar: "مجففات الشعر", en: "Hair Dryers", fr: "Sèche-cheveux" },
      { key: "straightener", ar: "مكواة تمليس", en: "Straighteners", fr: "Lisseurs" },
      { key: "curler", ar: "مكواة تجعيد", en: "Curlers", fr: "Boucleurs" },
    ],
  },
  {
    key: "beauty",
    ar: "منتجات التجميل",
    en: "Beauty",
    fr: "Beauté",
    icon: "🧴",
    heroImage: "https://picsum.photos/seed/sr-cat-beauty/900/900",
    subcategories: [
      { key: "hair-products", ar: "منتجات الشعر", en: "Hair Care", fr: "Soins capillaires" },
      { key: "oils", ar: "زيوت طبيعية", en: "Natural Oils", fr: "Huiles naturelles" },
      { key: "shea-butter", ar: "زبدة الشيا", en: "Shea Butter", fr: "Beurre de karité" },
      { key: "indian", ar: "منتجات هندية", en: "Indian Beauty", fr: "Beauté indienne" },
    ],
  },
  {
    key: "perfumes",
    ar: "مسك وعطور",
    en: "Musk & Perfumes",
    fr: "Musc & Parfums",
    icon: "🕌",
    heroImage: "https://picsum.photos/seed/sr-cat-perfumes/900/900",
    subcategories: [
      { key: "oud", ar: "عود", en: "Oud", fr: "Oud" },
      { key: "musk", ar: "مسك", en: "Musk", fr: "Musc" },
      { key: "attar", ar: "عطور شرقية", en: "Arabic Attar", fr: "Attar oriental" },
      { key: "floral", ar: "عطور زهرية", en: "Floral", fr: "Floral" },
    ],
  },
];

export function pickLocale(field: LocalizedField, locale: Locale): string {
  return field[locale] || field.en || field.ar;
}

export const subcategoryLabel = (key: SubCategoryKey, locale: Locale = "ar"): string => {
  for (const cat of categoryTree) {
    const sub = cat.subcategories.find((s) => s.key === key);
    if (sub) return sub[locale] || sub.en || sub.ar;
  }
  return key;
};

export const categoryLabel = (key: CategoryKey, locale: Locale = "ar"): string => {
  const cat = categoryTree.find((c) => c.key === key);
  if (!cat) return key;
  return cat[locale] || cat.en || cat.ar;
};

export type Product = {
  id: string;
  slug: string;
  name: LocalizedField;
  description: LocalizedField;
  price: number;
  compareAt?: number;
  currency: "SAR";
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  category: CategoryKey;
  subcategory: SubCategoryKey;
  tags: ("new" | "sale" | "bestseller" | "limited")[];
  stock: number;
};

const img = (seed: string) => `https://picsum.photos/seed/sr-${seed}/900/1200`;
const imgSq = (seed: string) => `https://picsum.photos/seed/sr-${seed}/800/800`;

const SIZES_CLOTHING = ["XS", "S", "M", "L", "XL"];
const SIZES_SHOES = ["36", "37", "38", "39", "40", "41"];
const SIZE_ONE = ["مقاس واحد"];

export const products: Product[] = [
  // ===== CLOTHING =====
  {
    id: "c-abaya-01", slug: "silk-black-abaya",
    name: { ar: "عباية حرير سوداء مطرزة", en: "Embroidered Silk Abaya" },
    description: {
      ar: "عباية من الحرير الطبيعي بتطريز يدوي على الكتف والأكمام. للمناسبات الاستثنائية.",
      en: "Natural silk abaya with hand embroidery at the shoulder and cuffs.",
    },
    price: 1290, compareAt: 1550, currency: "SAR",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "أسود", hex: "#0a0a0a" }],
    images: [img("abaya-01a"), img("abaya-01b")],
    category: "clothing", subcategory: "abayas",
    tags: ["sale", "bestseller"], stock: 6,
  },
  {
    id: "c-abaya-02", slug: "beige-pearl-abaya",
    name: { ar: "عباية بيج بلمسات لؤلؤية", en: "Pearl-accented Beige Abaya" },
    description: {
      ar: "قصة فضفاضة عصرية مع تفاصيل لؤلؤية خفيفة على الياقة.",
      en: "Relaxed modern cut with subtle pearl details at the collar.",
    },
    price: 890, currency: "SAR",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "بيج", hex: "#d4c0a8" }, { name: "زيتي", hex: "#5a6148" }],
    images: [img("abaya-02a"), img("abaya-02b")],
    category: "clothing", subcategory: "abayas",
    tags: ["new"], stock: 11,
  },
  {
    id: "c-mukhawar-01", slug: "emirati-gold-mukhawar",
    name: { ar: "مخوار إماراتي بتطريز ذهبي", en: "Gold-embroidered Mukhawar" },
    description: {
      ar: "مخوار فاخر بتطريز ذهبي يدوي، مستوحى من التراث الإماراتي الأصيل.",
      en: "Traditional Emirati mukhawar with hand-stitched gold thread.",
    },
    price: 1650, currency: "SAR",
    sizes: ["S-M", "L-XL"],
    colors: [{ name: "أخضر زمردي", hex: "#0d5c3f" }, { name: "بنفسجي", hex: "#4a2e5e" }],
    images: [img("mukhawar-01a"), img("mukhawar-01b")],
    category: "clothing", subcategory: "mukhawar",
    tags: ["limited", "bestseller"], stock: 4,
  },
  {
    id: "c-mukhawar-02", slug: "ivory-mukhawar",
    name: { ar: "مخوار عاجي للأعراس", en: "Ivory Wedding Mukhawar" },
    description: {
      ar: "قطعة احتفالية بتطريز دقيق على القماش الناعم العاجي.",
      en: "Ceremonial piece, intricate stitching on ivory silk.",
    },
    price: 2190, currency: "SAR",
    sizes: ["S-M", "L-XL"],
    colors: [{ name: "عاجي", hex: "#f0e5cc" }],
    images: [img("mukhawar-02a"), img("mukhawar-02b")],
    category: "clothing", subcategory: "mukhawar",
    tags: ["limited", "new"], stock: 3,
  },
  {
    id: "c-tunic-01", slug: "linen-oversized-tunic",
    name: { ar: "تونيك كتان فضفاض", en: "Oversized Linen Tunic" },
    description: {
      ar: "كتان بلجيكي خفيف، قصة مريحة تصلح للبيت والخروج.",
      en: "Belgian linen, relaxed fit for home and beyond.",
    },
    price: 380, currency: "SAR",
    sizes: SIZES_CLOTHING,
    colors: [
      { name: "أبيض", hex: "#f8f4ec" },
      { name: "كراميل", hex: "#b48563" },
      { name: "أسود", hex: "#111" },
    ],
    images: [img("tunic-01a"), img("tunic-01b")],
    category: "clothing", subcategory: "tunics",
    tags: ["bestseller"], stock: 22,
  },
  {
    id: "c-blouse-01", slug: "silk-wrap-blouse",
    name: { ar: "بلوزة حرير بلفة", en: "Silk Wrap Blouse" },
    description: {
      ar: "حرير طبيعي بقصة لفة أنيقة، للمناسبات والعمل.",
      en: "Pure silk with an elegant wrap cut.",
    },
    price: 520, currency: "SAR",
    sizes: SIZES_CLOTHING,
    colors: [{ name: "عاجي", hex: "#f5efe6" }, { name: "بيج رملي", hex: "#c8a988" }],
    images: [img("blouse-01a"), img("blouse-01b")],
    category: "clothing", subcategory: "blouses",
    tags: ["new"], stock: 14,
  },
  {
    id: "c-shirt-01", slug: "crisp-cotton-shirt",
    name: { ar: "قميص قطن أبيض كلاسيكي", en: "Classic Cotton Shirt" },
    description: {
      ar: "قطن مصري طويل التيلة، قصة محررة.",
      en: "Egyptian long-staple cotton, relaxed cut.",
    },
    price: 340, currency: "SAR",
    sizes: SIZES_CLOTHING,
    colors: [{ name: "أبيض", hex: "#fafafa" }, { name: "أزرق سماوي", hex: "#c5d9e6" }],
    images: [img("shirt-01a"), img("shirt-01b")],
    category: "clothing", subcategory: "shirts",
    tags: ["bestseller"], stock: 18,
  },
  {
    id: "c-pants-01", slug: "wide-leg-wool-pants",
    name: { ar: "بنطلون صوف واسع الساق", en: "Wide-leg Wool Pants" },
    description: {
      ar: "صوف إيطالي خفيف، خصر مرتفع، قصة واسعة نظيفة.",
      en: "Italian wool, high-waisted clean wide silhouette.",
    },
    price: 690, currency: "SAR",
    sizes: SIZES_CLOTHING,
    colors: [{ name: "أسود", hex: "#111" }, { name: "كحلي", hex: "#1f2a44" }],
    images: [img("pants-01a"), img("pants-01b")],
    category: "clothing", subcategory: "pants",
    tags: ["bestseller"], stock: 12,
  },
  {
    id: "c-skirt-01", slug: "pleated-midi-skirt",
    name: { ar: "تنورة بليسيه متوسطة الطول", en: "Pleated Midi Skirt" },
    description: {
      ar: "بليسيه دقيق، حركة طبيعية مع كل خطوة.",
      en: "Fine pleats, natural movement.",
    },
    price: 480, currency: "SAR",
    sizes: ["XS", "S", "M", "L"],
    colors: [{ name: "ذهبي شامبانيا", hex: "#d6b879" }, { name: "أسود", hex: "#111" }],
    images: [img("skirt-01a"), img("skirt-01b")],
    category: "clothing", subcategory: "skirts",
    tags: ["new"], stock: 9,
  },
  {
    id: "c-trench-01", slug: "beige-trench",
    name: { ar: "ترانش بيج خفيف", en: "Beige Lightweight Trench" },
    description: {
      ar: "ترانش من الخامة الإيطالية، قصة كلاسيكية للفصول الانتقالية.",
      en: "Italian fabric, classic trench for transitional seasons.",
    },
    price: 1150, compareAt: 1380, currency: "SAR",
    sizes: ["S", "M", "L"],
    colors: [{ name: "بيج", hex: "#c9a984" }],
    images: [img("trench-01a"), img("trench-01b")],
    category: "clothing", subcategory: "trench",
    tags: ["sale"], stock: 5,
  },
  {
    id: "c-coat-01", slug: "wool-long-coat",
    name: { ar: "معطف صوفي طويل بحزام", en: "Belted Long Wool Coat" },
    description: {
      ar: "صوف بكر إيطالي، قصة محررة، حزام من نفس القماش.",
      en: "Italian virgin wool, relaxed silhouette, self-fabric belt.",
    },
    price: 1650, currency: "SAR",
    sizes: ["S", "M", "L"],
    colors: [{ name: "كاميل", hex: "#b78b60" }, { name: "رمادي", hex: "#4a4a4a" }],
    images: [img("coat-01a"), img("coat-01b")],
    category: "clothing", subcategory: "coats",
    tags: ["new"], stock: 7,
  },
  {
    id: "c-swim-01", slug: "modest-swimsuit",
    name: { ar: "لباس سباحة محتشم بكم طويل", en: "Modest Full-coverage Swimsuit" },
    description: {
      ar: "خامة عالية الجودة مقاومة للكلور، قصة محتشمة مريحة.",
      en: "Chlorine-resistant fabric with modest, comfortable cut.",
    },
    price: 420, currency: "SAR",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "أسود", hex: "#111" }, { name: "كحلي", hex: "#1f2a44" }],
    images: [img("swim-01a"), img("swim-01b")],
    category: "clothing", subcategory: "swimwear",
    tags: ["new"], stock: 16,
  },

  // ===== SHOES =====
  {
    id: "s-heels-01", slug: "nude-leather-heels",
    name: { ar: "كعب جلدي نيود", en: "Nude Leather Heels" },
    description: {
      ar: "جلد إيطالي طبيعي، كعب ٨ سم، أريحية ليوم كامل.",
      en: "Italian leather, 8cm heel, all-day comfort.",
    },
    price: 780, currency: "SAR",
    sizes: SIZES_SHOES,
    colors: [{ name: "نيود", hex: "#dcbfa4" }, { name: "أسود", hex: "#111" }],
    images: [img("heels-01a"), img("heels-01b")],
    category: "shoes", subcategory: "heels",
    tags: ["bestseller"], stock: 14,
  },
  {
    id: "s-sneakers-01", slug: "white-leather-sneakers",
    name: { ar: "أحذية رياضية جلدية بيضاء", en: "White Leather Sneakers" },
    description: {
      ar: "تصميم نظيف بسيط، جلد صديق للبيئة.",
      en: "Clean design, eco-friendly leather.",
    },
    price: 590, compareAt: 720, currency: "SAR",
    sizes: SIZES_SHOES,
    colors: [{ name: "أبيض", hex: "#f8f8f8" }],
    images: [img("sneakers-01a"), img("sneakers-01b")],
    category: "shoes", subcategory: "sneakers",
    tags: ["sale", "bestseller"], stock: 19,
  },
  {
    id: "s-sandals-01", slug: "strappy-sandals",
    name: { ar: "صندل بسيور متقاطعة", en: "Crossover Strap Sandals" },
    description: {
      ar: "صندل مسطح مريح، مناسب للصيف والسفر.",
      en: "Flat comfort sandal for summer and travel.",
    },
    price: 380, currency: "SAR",
    sizes: SIZES_SHOES,
    colors: [{ name: "بني", hex: "#6b4a2e" }, { name: "أسود", hex: "#111" }],
    images: [img("sandals-01a"), img("sandals-01b")],
    category: "shoes", subcategory: "sandals",
    tags: ["new"], stock: 22,
  },
  {
    id: "s-boots-01", slug: "knee-high-boots",
    name: { ar: "بوت طويل للركبة", en: "Knee-high Boots" },
    description: {
      ar: "بوت جلدي إيطالي بارتفاع الركبة، كعب متوسط.",
      en: "Italian leather knee-high with mid heel.",
    },
    price: 1290, currency: "SAR",
    sizes: SIZES_SHOES,
    colors: [{ name: "أسود", hex: "#111" }, { name: "بني داكن", hex: "#3d2617" }],
    images: [img("boots-01a"), img("boots-01b")],
    category: "shoes", subcategory: "boots",
    tags: ["limited"], stock: 6,
  },
  {
    id: "s-slippers-01", slug: "embroidered-slippers",
    name: { ar: "بابوج مطرز", en: "Embroidered Slippers" },
    description: {
      ar: "بابوج مريح للمنزل بتطريز يدوي دقيق.",
      en: "Comfortable house slippers with hand embroidery.",
    },
    price: 220, currency: "SAR",
    sizes: ["36-37", "38-39", "40-41"],
    colors: [
      { name: "عاجي", hex: "#ead8bd" },
      { name: "زيتي", hex: "#5a6148" },
      { name: "أسود", hex: "#111" },
    ],
    images: [img("slippers-01a"), img("slippers-01b")],
    category: "shoes", subcategory: "slippers",
    tags: ["new"], stock: 30,
  },
  {
    id: "s-heels-02", slug: "black-pointed-heels",
    name: { ar: "كعب بمقدمة مدببة أسود", en: "Black Pointed-toe Heels" },
    description: {
      ar: "قطعة كلاسيكية لا تفشل، جلد طبيعي ناعم.",
      en: "A classic that never fails. Soft genuine leather.",
    },
    price: 690, currency: "SAR",
    sizes: SIZES_SHOES,
    colors: [{ name: "أسود", hex: "#111" }],
    images: [img("heels-02a"), img("heels-02b")],
    category: "shoes", subcategory: "heels",
    tags: ["bestseller"], stock: 11,
  },

  // ===== HAIR TOOLS =====
  {
    id: "h-dryer-01", slug: "ionic-hair-dryer",
    name: { ar: "مجفف شعر أيوني احترافي", en: "Professional Ionic Hair Dryer" },
    description: {
      ar: "تقنية أيونية تقلل التجعد، ٣ مستويات حرارة، ضمان سنتين.",
      en: "Ionic technology, 3 heat settings, 2-year warranty.",
    },
    price: 890, compareAt: 1100, currency: "SAR",
    sizes: SIZE_ONE,
    colors: [{ name: "وردي ذهبي", hex: "#d4a590" }, { name: "أسود", hex: "#1a1a1a" }],
    images: [imgSq("dryer-01a"), imgSq("dryer-01b")],
    category: "hair-tools", subcategory: "hair-dryer",
    tags: ["sale", "bestseller"], stock: 9,
  },
  {
    id: "h-straight-01", slug: "ceramic-straightener",
    name: { ar: "مكواة سيراميك للتمليس", en: "Ceramic Hair Straightener" },
    description: {
      ar: "ألواح سيراميك بطول ٣٠ سم، وصول حتى ٢٣٠ درجة.",
      en: "Ceramic plates 30cm, up to 230°C.",
    },
    price: 450, currency: "SAR",
    sizes: SIZE_ONE,
    colors: [{ name: "أسود", hex: "#1a1a1a" }],
    images: [imgSq("straight-01a")],
    category: "hair-tools", subcategory: "straightener",
    tags: ["bestseller"], stock: 17,
  },
  {
    id: "h-curler-01", slug: "auto-curler",
    name: { ar: "مكواة تجعيد أوتوماتيكية", en: "Automatic Curler" },
    description: {
      ar: "لف تلقائي بزر واحد، تجعيدات طبيعية تدوم.",
      en: "One-button auto-curl, natural long-lasting waves.",
    },
    price: 690, currency: "SAR",
    sizes: SIZE_ONE,
    colors: [{ name: "وردي", hex: "#e8b4be" }],
    images: [imgSq("curler-01a")],
    category: "hair-tools", subcategory: "curler",
    tags: ["new"], stock: 13,
  },

  // ===== BEAUTY =====
  {
    id: "b-oil-01", slug: "argan-hair-oil",
    name: { ar: "زيت أرغان طبيعي ١٠٠٪", en: "100% Pure Argan Oil" },
    description: {
      ar: "زيت أرغان مغربي معصور على البارد، للشعر والبشرة.",
      en: "Cold-pressed Moroccan argan oil, for hair and skin.",
    },
    price: 180, currency: "SAR",
    sizes: ["٥٠ مل", "١٠٠ مل"],
    colors: [{ name: "ذهبي", hex: "#d4a349" }],
    images: [imgSq("oil-argan"), imgSq("oil-argan-b")],
    category: "beauty", subcategory: "oils",
    tags: ["bestseller", "new"], stock: 45,
  },
  {
    id: "b-oil-02", slug: "amla-indian-oil",
    name: { ar: "زيت أملا هندي للشعر", en: "Indian Amla Hair Oil" },
    description: {
      ar: "يقوي الشعر ويعزز نموه، وصفة هندية أصيلة.",
      en: "Strengthens hair and promotes growth, authentic Indian recipe.",
    },
    price: 95, currency: "SAR",
    sizes: ["١٠٠ مل", "٢٠٠ مل"],
    colors: [{ name: "أخضر", hex: "#3d5a30" }],
    images: [imgSq("oil-amla"), imgSq("oil-amla-b")],
    category: "beauty", subcategory: "indian",
    tags: ["bestseller"], stock: 38,
  },
  {
    id: "b-shea-01", slug: "raw-shea-butter",
    name: { ar: "زبدة شيا خام أفريقية", en: "Raw African Shea Butter" },
    description: {
      ar: "زبدة شيا غير مكررة من غانا، للبشرة الجافة والشعر.",
      en: "Unrefined Ghanaian shea butter for dry skin and hair.",
    },
    price: 120, currency: "SAR",
    sizes: ["٢٠٠ جم", "٥٠٠ جم"],
    colors: [{ name: "كريمي", hex: "#f4e4c1" }],
    images: [imgSq("shea-01"), imgSq("shea-01-b")],
    category: "beauty", subcategory: "shea-butter",
    tags: ["new"], stock: 26,
  },
  {
    id: "b-mask-01", slug: "indian-henna-mask",
    name: { ar: "ماسك حناء هندي للشعر", en: "Indian Henna Hair Mask" },
    description: {
      ar: "حناء هندية طبيعية ١٠٠٪، تغذية ولمعان فوري.",
      en: "100% natural Indian henna for nourishment and shine.",
    },
    price: 85, currency: "SAR",
    sizes: ["٢٥٠ جم"],
    colors: [{ name: "أخضر داكن", hex: "#2d4d2d" }],
    images: [imgSq("henna-01")],
    category: "beauty", subcategory: "indian",
    tags: ["bestseller"], stock: 52,
  },
  {
    id: "b-hair-01", slug: "hair-serum",
    name: { ar: "سيروم مغذٍّ للشعر", en: "Nourishing Hair Serum" },
    description: {
      ar: "يحمي من الحرارة ويمنح لمعاناً طبيعياً بلا ثقل.",
      en: "Heat protection with weightless natural shine.",
    },
    price: 145, compareAt: 190, currency: "SAR",
    sizes: ["٦٠ مل"],
    colors: [{ name: "شفاف", hex: "#e8e4dc" }],
    images: [imgSq("serum-01"), imgSq("serum-01-b")],
    category: "beauty", subcategory: "hair-products",
    tags: ["sale"], stock: 34,
  },
  {
    id: "b-oil-03", slug: "black-seed-oil",
    name: { ar: "زيت حبة البركة", en: "Black Seed Oil" },
    description: {
      ar: "زيت حبة البركة المصري المعصور على البارد.",
      en: "Cold-pressed Egyptian black seed oil.",
    },
    price: 110, currency: "SAR",
    sizes: ["٥٠ مل", "١٠٠ مل"],
    colors: [{ name: "كهرماني", hex: "#7a4d1a" }],
    images: [imgSq("oil-black"), imgSq("oil-black-b")],
    category: "beauty", subcategory: "oils",
    tags: ["new"], stock: 41,
  },

  // ===== PERFUMES =====
  {
    id: "p-oud-01", slug: "royal-oud",
    name: { ar: "عود ملكي", en: "Royal Oud" },
    description: {
      ar: "عود كمبودي فاخر، نفحات دافئة طويلة الثبات.",
      en: "Premium Cambodian oud, warm long-lasting notes.",
    },
    price: 890, currency: "SAR",
    sizes: ["٦ مل", "١٢ مل"],
    colors: [{ name: "كهرماني داكن", hex: "#4a2e17" }],
    images: [imgSq("perfume-oud"), imgSq("perfume-oud-b")],
    category: "perfumes", subcategory: "oud",
    tags: ["limited", "bestseller"], stock: 8,
  },
  {
    id: "p-musk-01", slug: "white-musk",
    name: { ar: "مسك أبيض", en: "White Musk" },
    description: {
      ar: "مسك نقي هادئ يدوم طول اليوم.",
      en: "Pure soft musk that lasts all day.",
    },
    price: 320, currency: "SAR",
    sizes: ["١٢ مل", "٢٥ مل"],
    colors: [{ name: "أبيض", hex: "#f5f0e8" }],
    images: [imgSq("perfume-musk"), imgSq("perfume-musk-b")],
    category: "perfumes", subcategory: "musk",
    tags: ["bestseller"], stock: 24,
  },
  {
    id: "p-attar-01", slug: "rose-attar",
    name: { ar: "عطر ورد طائفي", en: "Taifi Rose Attar" },
    description: {
      ar: "عطر الورد الطائفي الأصلي، رائحة ربيع كاملة.",
      en: "Authentic Taifi rose attar — spring in a bottle.",
    },
    price: 420, compareAt: 520, currency: "SAR",
    sizes: ["٦ مل", "١٢ مل"],
    colors: [{ name: "وردي", hex: "#d8a4ae" }],
    images: [imgSq("perfume-rose"), imgSq("perfume-rose-b")],
    category: "perfumes", subcategory: "attar",
    tags: ["sale", "limited"], stock: 11,
  },
  {
    id: "p-floral-01", slug: "jasmine-night",
    name: { ar: "ياسمين الليل", en: "Jasmine Night" },
    description: {
      ar: "ياسمين دمشقي مع قلب من الفانيلا، للسهرات.",
      en: "Damascene jasmine on a vanilla heart, for evenings.",
    },
    price: 380, currency: "SAR",
    sizes: ["٥٠ مل", "١٠٠ مل"],
    colors: [{ name: "ذهبي", hex: "#d4b96c" }],
    images: [imgSq("perfume-jasmine"), imgSq("perfume-jasmine-b")],
    category: "perfumes", subcategory: "floral",
    tags: ["new"], stock: 17,
  },
];

export type HeroSlide = {
  eyebrow: LocalizedField;
  title: LocalizedField;
  sub: LocalizedField;
  cta: LocalizedField;
  image: string;
  align: "start" | "center" | "end";
};

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: { ar: "مجموعة الخريف ٢٠٢٦", en: "Autumn Collection 2026", fr: "Collection Automne 2026" },
    title: { ar: "قِطع تَبقى", en: "Pieces that endure", fr: "Des pièces qui durent" },
    sub: {
      ar: "اختيار محدود، من الأزياء إلى العطور. صنعةٌ تستحق وقتَها.",
      en: "A curated edit, from fashion to fragrance. Craft worth its time.",
      fr: "Une sélection mesurée, de la mode aux parfums. L'artisanat à son rythme.",
    },
    cta: { ar: "اكتشفي المجموعة", en: "Shop the collection", fr: "Découvrir la collection" },
    image: "https://picsum.photos/seed/sr-hero-01/1800/1000",
    align: "start",
  },
  {
    eyebrow: { ar: "عطور وعود", en: "Oud & Promise", fr: "Oud & Promesses" },
    title: { ar: "رائحةٌ تَبقى", en: "A scent that stays", fr: "Un sillage qui demeure" },
    sub: {
      ar: "عود كمبودي، مسك أبيض، ورد طائفي أصيل.",
      en: "Cambodian oud, white musk, authentic Taif rose.",
      fr: "Oud cambodgien, musc blanc, rose de Taïf authentique.",
    },
    cta: { ar: "تسوقي العطور", en: "Shop perfumes", fr: "Découvrir les parfums" },
    image: "https://picsum.photos/seed/sr-hero-perfume/1800/1000",
    align: "center",
  },
  {
    eyebrow: { ar: "إصدار محدود", en: "Limited edition", fr: "Édition limitée" },
    title: { ar: "مخاوير إماراتية", en: "Emirati Mukhawar", fr: "Mukhawar émirati" },
    sub: {
      ar: "ثلاثة أسابيع من التطريز اليدوي لكل قطعة.",
      en: "Three weeks of hand embroidery per piece.",
      fr: "Trois semaines de broderie main par pièce.",
    },
    cta: { ar: "احجزي قطعتك", en: "Reserve yours", fr: "Réserver la vôtre" },
    image: "https://picsum.photos/seed/sr-hero-mukhawar/1800/1000",
    align: "end",
  },
];

export const findProduct = (idOrSlug: string) =>
  products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);

export const productsIn = (
  category?: CategoryKey,
  subcategory?: SubCategoryKey,
) =>
  products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!subcategory || p.subcategory === subcategory),
  );

// Kept for backwards compatibility with CategoryBanners import
export const categories = categoryTree.map((c) => ({
  key: c.key,
  ar: c.ar,
  image: c.heroImage,
}));
