"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "./client";
import { getCurrentUser, isAuthed } from "@/app/admin/_lib/auth";
import { WA_KEYS, getConfig, sendText } from "@/app/_lib/whatsapp/client";
import { logAuditEvent } from "./audit-repo";

export type WhatsappStatus = {
  configured: boolean;
  phoneNumberId: string; // not secret — shown so the merchant can verify it
  verifyToken: string; // needed to paste into Meta's webhook config
  hasToken: boolean; // secret — never returned, just whether it's set
  hasAppSecret: boolean; // secret — never returned
};

async function readMap(): Promise<Record<string, string>> {
  if (!isDbConfigured()) return {};
  try {
    const rows = await getDb()
      .select()
      .from(schema.settings)
      .where(inArray(schema.settings.key, Object.values(WA_KEYS)));
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}

/** Connection status for the admin panel — never returns the access token or app secret. */
export async function getWhatsappStatusAction(): Promise<WhatsappStatus> {
  if (!(await isAuthed())) throw new Error("unauthorized");
  const map = await readMap();
  const val = (k: string, env?: string) => (map[k]?.trim() || env?.trim() || "");
  const token = val(WA_KEYS.token, process.env.WHATSAPP_TOKEN);
  const phoneNumberId = val(WA_KEYS.phoneNumberId, process.env.WHATSAPP_PHONE_NUMBER_ID);
  const verifyToken = val(WA_KEYS.verifyToken, process.env.WHATSAPP_VERIFY_TOKEN);
  const appSecret = val(WA_KEYS.appSecret, process.env.WHATSAPP_APP_SECRET);
  return {
    configured: !!(token && phoneNumberId && verifyToken),
    phoneNumberId,
    verifyToken,
    hasToken: !!token,
    hasAppSecret: !!appSecret,
  };
}

/** Save WhatsApp credentials. Only non-empty fields are written, so leaving a
 *  secret field blank keeps the existing value. */
export async function saveWhatsappConfigAction(input: {
  token?: string;
  phoneNumberId?: string;
  verifyToken?: string;
  appSecret?: string;
}): Promise<{ ok: true; saved: number } | { ok: false; error: string }> {
  if (!(await isAuthed())) return { ok: false, error: "unauthorized" };
  if (!isDbConfigured()) return { ok: false, error: "db_not_configured" };

  const entries: [string, string][] = [];
  const add = (k: string, v?: string) => {
    if (typeof v === "string" && v.trim()) entries.push([k, v.trim()]);
  };
  add(WA_KEYS.token, input.token);
  add(WA_KEYS.phoneNumberId, input.phoneNumberId);
  add(WA_KEYS.verifyToken, input.verifyToken);
  add(WA_KEYS.appSecret, input.appSecret);
  if (entries.length === 0) return { ok: true, saved: 0 };

  for (const [key, value] of entries) {
    await getDb()
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  const user = await getCurrentUser();
  void logAuditEvent({
    actor: user
      ? { id: user.id, username: user.username, role: user.role }
      : { id: null, username: null, role: null },
    action: "settings.whatsapp_updated",
    targetType: "settings",
    targetId: "whatsapp",
    metadata: { fields: entries.map(([k]) => k) },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit");
  return { ok: true, saved: entries.length };
}

/** Send a test WhatsApp message to verify the connection works end to end. */
export async function sendWhatsappTestAction(
  toPhone: string,
  message?: string,
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  if (!(await isAuthed())) return { ok: false, error: "unauthorized" };
  const to = (toPhone || "").trim();
  if (to.replace(/\D/g, "").length < 8) return { ok: false, error: "invalid_phone" };
  const cfg = await getConfig();
  if (!cfg) return { ok: false, error: "whatsapp_not_configured" };
  const body =
    (message || "").trim() ||
    "✅ Test from your RACHÉL admin — WhatsApp is connected.";
  return sendText(to, body);
}
