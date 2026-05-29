import "server-only";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";

export type SectionKey =
  | "brand_reveal"
  | "hero"
  | "marquee"
  | "category_banners"
  | "new_arrivals"
  | "story"
  | "bestsellers"
  | "perfumes"
  | "beauty";

export type SectionEntry = { key: SectionKey; visible: boolean };

export const SECTION_LABEL: Record<SectionKey, string> = {
  brand_reveal: "Brand intro animation",
  hero: "Hero slider",
  marquee: "Marquee announcement strip",
  category_banners: "Category banners",
  new_arrivals: "New arrivals grid",
  story: "Brand story",
  bestsellers: "Bestsellers grid",
  perfumes: "Perfumes highlight grid",
  beauty: "Beauty highlight grid",
};

export const SECTION_DESCRIPTION: Record<SectionKey, string> = {
  brand_reveal: "Animated RACHÉL reveal at page load",
  hero: "Top full-width image carousel",
  marquee: "Scrolling text strip below the hero",
  category_banners: "Tiles linking to each catalog section",
  new_arrivals: "Products tagged 'new'",
  story: "Editorial brand story block",
  bestsellers: "Products tagged 'bestseller'",
  perfumes: "Products in the Musk & Perfumes category",
  beauty: "Products in the Beauty category",
};

export const DEFAULT_LAYOUT: SectionEntry[] = [
  { key: "brand_reveal", visible: true },
  { key: "hero", visible: true },
  { key: "marquee", visible: true },
  { key: "category_banners", visible: true },
  { key: "new_arrivals", visible: true },
  { key: "story", visible: true },
  { key: "bestsellers", visible: true },
  { key: "perfumes", visible: true },
  { key: "beauty", visible: true },
];

const LAYOUT_KEY = "homepage_layout";
const VALID_KEYS = new Set<SectionKey>(DEFAULT_LAYOUT.map((s) => s.key));

function sanitize(input: unknown): SectionEntry[] {
  if (!Array.isArray(input)) return DEFAULT_LAYOUT;
  const seen = new Set<SectionKey>();
  const out: SectionEntry[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const obj = item as { key?: unknown; visible?: unknown };
    if (typeof obj.key !== "string") continue;
    if (!VALID_KEYS.has(obj.key as SectionKey)) continue;
    if (seen.has(obj.key as SectionKey)) continue;
    seen.add(obj.key as SectionKey);
    out.push({ key: obj.key as SectionKey, visible: obj.visible !== false });
  }
  // Append any missing sections at the end (hidden) so new sections never silently disappear
  for (const def of DEFAULT_LAYOUT) {
    if (!seen.has(def.key)) out.push(def);
  }
  return out;
}

export async function getHomepageLayout(): Promise<SectionEntry[]> {
  if (!isDbConfigured()) return DEFAULT_LAYOUT;
  try {
    const rows = await getDb()
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, LAYOUT_KEY))
      .limit(1);
    if (rows.length === 0) return DEFAULT_LAYOUT;
    return sanitize(JSON.parse(rows[0].value));
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export async function saveHomepageLayout(layout: SectionEntry[]): Promise<void> {
  if (!isDbConfigured()) throw new Error("Database not configured");
  const clean = sanitize(layout);
  const value = JSON.stringify(clean);
  await getDb()
    .insert(schema.settings)
    .values({ key: LAYOUT_KEY, value })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() },
    });
}
