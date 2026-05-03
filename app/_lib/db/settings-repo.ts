import "server-only";
import { getDb, isDbConfigured, schema } from "./client";

export type SettingsMap = {
  brand_name: string;
  tagline: string;
  default_locale: string;
  supported_locales: string;
  currency: string;
  free_ship_threshold: string;
  returns_window: string;
  whatsapp: string;
  email: string;
  instagram: string;
};

export const SETTINGS_KEYS: (keyof SettingsMap)[] = [
  "brand_name",
  "tagline",
  "default_locale",
  "supported_locales",
  "currency",
  "free_ship_threshold",
  "returns_window",
  "whatsapp",
  "email",
  "instagram",
];

export const SETTINGS_DEFAULTS: SettingsMap = {
  brand_name: "RACHÉL",
  tagline: "Quiet luxury, redefined.",
  default_locale: "ar",
  supported_locales: "ar · en · fr",
  currency: "SAR",
  free_ship_threshold: "500",
  returns_window: "14",
  whatsapp: "+966 50 000 0000",
  email: "hello@rachel.com",
  instagram: "@rachel.boutique",
};

export async function loadSettings(): Promise<SettingsMap> {
  if (!isDbConfigured()) return { ...SETTINGS_DEFAULTS };
  try {
    const rows = await getDb().select().from(schema.settings);
    const map: SettingsMap = { ...SETTINGS_DEFAULTS };
    for (const r of rows) {
      if (SETTINGS_KEYS.includes(r.key as keyof SettingsMap)) {
        map[r.key as keyof SettingsMap] = r.value;
      }
    }
    return map;
  } catch (err) {
    console.error("[settings-repo] DB read failed, using defaults:", err);
    return { ...SETTINGS_DEFAULTS };
  }
}
