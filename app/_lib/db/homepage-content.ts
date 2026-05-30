import "server-only";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import { categoryTree, heroSlides as defaultHeroSlides } from "@/app/(storefront)/_lib/products";

export type LocalizedText = { ar: string; en: string; fr?: string };

export type HeroSlideContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  sub: LocalizedText;
  cta: LocalizedText;
  image: string;
  align: "start" | "center" | "end";
};

export type StoryContent = {
  image: string;
  eyebrow?: LocalizedText;
  title?: LocalizedText;
  body?: LocalizedText;
};

export type MarqueeContent = {
  ar: string[];
  en: string[];
  fr: string[];
};

export type CategoryBannerOverrides = Record<string, string>; // category key -> image url

export type HomepageContent = {
  hero: HeroSlideContent[];
  marquee: MarqueeContent;
  story: StoryContent;
  categoryBanners: CategoryBannerOverrides;
};

const KEY = "homepage_content";

const DEFAULT_MARQUEE_EN = [
  "Free shipping over MAD 500",
  "Free returns within 14 days",
  "Complimentary gift wrapping",
  "Installments up to 6 months at 0%",
  "24/7 WhatsApp support",
];
const DEFAULT_MARQUEE_AR = [
  "شحن مجاني فوق ٥٠٠ د.م.",
  "إرجاع مجاني خلال ١٤ يوم",
  "تغليف هدايا مجاني",
  "تقسيط حتى ٦ أشهر بدون فوائد",
  "دعم واتساب ٢٤/٧",
];
const DEFAULT_MARQUEE_FR = [
  "Livraison offerte dès 500 MAD",
  "Retours gratuits sous 14 jours",
  "Emballage cadeau offert",
  "Paiement en 6× sans frais",
  "Support WhatsApp 24/7",
];

const DEFAULT_STORY: StoryContent = {
  image: "https://picsum.photos/seed/sr-story-atelier/1200/1500",
  eyebrow: { ar: "قصتنا", en: "Our story", fr: "Notre histoire" },
  title: { ar: "أناقةٌ تَصنع نفسَها", en: "Quiet elegance, made", fr: "L'élégance qui se crée" },
  body: {
    ar: "في RACHÉL نؤمن أن الأناقة ليست صاخبة. هي انتقاءٌ هادئ.",
    en: "At RACHÉL we believe elegance doesn't shout. It's a quiet choice.",
    fr: "Chez RACHÉL nous croyons que l'élégance ne crie pas.",
  },
};

export const DEFAULT_CONTENT: HomepageContent = {
  hero: defaultHeroSlides.map((s) => ({
    eyebrow: s.eyebrow,
    title: s.title,
    sub: s.sub,
    cta: s.cta,
    image: s.image,
    align: s.align,
  })),
  marquee: { en: DEFAULT_MARQUEE_EN, ar: DEFAULT_MARQUEE_AR, fr: DEFAULT_MARQUEE_FR },
  story: DEFAULT_STORY,
  categoryBanners: Object.fromEntries(categoryTree.map((c) => [c.key, c.heroImage])),
};

function isLocalizedText(v: unknown): v is LocalizedText {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.en === "string" && typeof o.ar === "string";
}

function sanitize(input: unknown): HomepageContent {
  if (!input || typeof input !== "object") return DEFAULT_CONTENT;
  const obj = input as Record<string, unknown>;

  const hero = Array.isArray(obj.hero)
    ? obj.hero
        .filter((s): s is HeroSlideContent => {
          if (!s || typeof s !== "object") return false;
          const x = s as Record<string, unknown>;
          return (
            typeof x.image === "string" &&
            isLocalizedText(x.eyebrow) &&
            isLocalizedText(x.title) &&
            isLocalizedText(x.sub) &&
            isLocalizedText(x.cta) &&
            (x.align === "start" || x.align === "center" || x.align === "end")
          );
        })
    : [];

  const marqueeRaw = (obj.marquee ?? {}) as Record<string, unknown>;
  const marqueeLang = (v: unknown, fallback: string[]) =>
    Array.isArray(v) ? v.map((s) => String(s)).filter((s) => s.trim()) : fallback;
  const marquee = {
    ar: marqueeLang(marqueeRaw.ar, DEFAULT_MARQUEE_AR),
    en: marqueeLang(marqueeRaw.en, DEFAULT_MARQUEE_EN),
    fr: marqueeLang(marqueeRaw.fr, DEFAULT_MARQUEE_FR),
  };

  const storyRaw = (obj.story ?? {}) as Record<string, unknown>;
  const story: StoryContent = {
    image: typeof storyRaw.image === "string" && storyRaw.image ? storyRaw.image : DEFAULT_STORY.image,
    eyebrow: isLocalizedText(storyRaw.eyebrow) ? storyRaw.eyebrow : DEFAULT_STORY.eyebrow,
    title: isLocalizedText(storyRaw.title) ? storyRaw.title : DEFAULT_STORY.title,
    body: isLocalizedText(storyRaw.body) ? storyRaw.body : DEFAULT_STORY.body,
  };

  const cbRaw = (obj.categoryBanners ?? {}) as Record<string, unknown>;
  const categoryBanners: CategoryBannerOverrides = {};
  for (const c of categoryTree) {
    const v = cbRaw[c.key];
    categoryBanners[c.key] = typeof v === "string" && v ? v : c.heroImage;
  }

  return {
    hero: hero.length > 0 ? hero : DEFAULT_CONTENT.hero,
    marquee,
    story,
    categoryBanners,
  };
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!isDbConfigured()) return DEFAULT_CONTENT;
  try {
    const rows = await getDb()
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, KEY))
      .limit(1);
    if (rows.length === 0) return DEFAULT_CONTENT;
    return sanitize(JSON.parse(rows[0].value));
  } catch {
    return DEFAULT_CONTENT;
  }
}

export async function saveHomepageContent(content: HomepageContent): Promise<void> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  const clean = sanitize(content);
  const value = JSON.stringify(clean);
  await getDb()
    .insert(schema.settings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() },
    });
}
