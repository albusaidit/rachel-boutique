import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/app/_lib/db/client";

const GRAPH_VERSION = "v22.0";

export type WhatsappConfig = {
  token: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string | null;
};

export function getConfig(): WhatsappConfig | null {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET ?? null;
  if (!token || !phoneNumberId || !verifyToken) return null;
  return { token, phoneNumberId, verifyToken, appSecret };
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

async function callGraph(
  cfg: WhatsappConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: { messages?: Array<{ id: string }> } } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneNumberId}${path}`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${cfg.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Meta API ${res.status}: ${text.slice(0, 400)}` };
    }
    const data = (await res.json()) as { messages?: Array<{ id: string }> };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "request_failed" };
  }
}

async function persistOutbound(args: {
  cfg: WhatsappConfig;
  to: string;
  body: string;
  templateName: string | null;
  orderId: number | null;
  result: Awaited<ReturnType<typeof callGraph>>;
}): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const status = args.result.ok ? "sent" : "failed";
    const waMessageId = args.result.ok ? args.result.data.messages?.[0]?.id ?? null : null;
    const error = args.result.ok ? null : args.result.error;
    await getDb().insert(schema.whatsappMessages).values({
      orderId: args.orderId,
      direction: "out",
      fromPhone: args.cfg.phoneNumberId,
      toPhone: normalizePhone(args.to),
      body: args.body,
      templateName: args.templateName,
      waMessageId,
      status,
      error,
    });
  } catch {
    // never let logging failures bubble up
  }
}

export async function sendText(
  to: string,
  body: string,
  opts?: { orderId?: number | null },
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, error: "whatsapp_not_configured" };
  const normalized = normalizePhone(to);
  if (!normalized) return { ok: false, error: "invalid_phone" };
  const result = await callGraph(cfg, "/messages", {
    messaging_product: "whatsapp",
    to: normalized,
    type: "text",
    text: { preview_url: false, body },
  });
  await persistOutbound({
    cfg,
    to: normalized,
    body,
    templateName: null,
    orderId: opts?.orderId ?? null,
    result,
  });
  if (!result.ok) return result;
  return { ok: true, id: result.data.messages?.[0]?.id ?? null };
}

export async function sendTemplate(args: {
  to: string;
  name: string;
  language: string;
  components?: Array<unknown>;
  bodyText: string; // human-readable copy to store in the message log
  orderId?: number | null;
}): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const cfg = getConfig();
  if (!cfg) return { ok: false, error: "whatsapp_not_configured" };
  const normalized = normalizePhone(args.to);
  if (!normalized) return { ok: false, error: "invalid_phone" };
  const result = await callGraph(cfg, "/messages", {
    messaging_product: "whatsapp",
    to: normalized,
    type: "template",
    template: {
      name: args.name,
      language: { code: args.language },
      ...(args.components && args.components.length > 0
        ? { components: args.components }
        : {}),
    },
  });
  await persistOutbound({
    cfg,
    to: normalized,
    body: args.bodyText,
    templateName: args.name,
    orderId: args.orderId ?? null,
    result,
  });
  if (!result.ok) return result;
  return { ok: true, id: result.data.messages?.[0]?.id ?? null };
}

export function verifySignature(rawBody: string, headerSignature: string | null): boolean {
  const cfg = getConfig();
  if (!cfg || !cfg.appSecret) return false;
  if (!headerSignature) return false;
  const expected = "sha256=" + createHmac("sha256", cfg.appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(headerSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function persistInbound(args: {
  from: string;
  to: string;
  body: string;
  waMessageId: string;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const from = normalizePhone(args.from);
  let orderId: number | null = null;
  try {
    const recent = await getDb()
      .select({ id: schema.orders.id, phone: schema.orders.phone })
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(50);
    const hit = recent.find((o) => normalizePhone(o.phone) === from);
    if (hit) orderId = hit.id;
  } catch {
    // best-effort match
  }
  await getDb().insert(schema.whatsappMessages).values({
    orderId,
    direction: "in",
    fromPhone: from,
    toPhone: normalizePhone(args.to),
    body: args.body,
    waMessageId: args.waMessageId,
    status: "received",
  });
}

export type WhatsappThreadMessage = {
  id: number;
  direction: "in" | "out";
  body: string;
  status: string;
  createdAt: string;
  templateName: string | null;
  error: string | null;
};

export async function listMessagesForOrder(orderId: number): Promise<WhatsappThreadMessage[]> {
  if (!isDbConfigured()) return [];
  try {
    const rows = await getDb()
      .select()
      .from(schema.whatsappMessages)
      .where(eq(schema.whatsappMessages.orderId, orderId))
      .orderBy(schema.whatsappMessages.createdAt);
    return rows.map((r) => ({
      id: r.id,
      direction: r.direction === "in" ? "in" : "out",
      body: r.body,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      templateName: r.templateName ?? null,
      error: r.error ?? null,
    }));
  } catch {
    return [];
  }
}
