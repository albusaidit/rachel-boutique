import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getConfig, persistInbound, verifySignature } from "@/app/_lib/whatsapp/client";

// Meta verification handshake — they hit this once when you set up the webhook.
export async function GET(req: Request) {
  const cfg = await getConfig();
  if (!cfg) return new NextResponse("not_configured", { status: 503 });
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === cfg.verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

type WebhookText = { body?: string };
type WebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: WebhookText;
};
type WebhookValue = {
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  messages?: WebhookMessage[];
};
type WebhookEntry = { changes?: Array<{ value?: WebhookValue }> };
type WebhookPayload = { entry?: WebhookEntry[] };

export async function POST(req: Request) {
  const cfg = await getConfig();
  if (!cfg) return new NextResponse("not_configured", { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  // Only enforce signature when an app secret is configured.
  if (cfg.appSecret && !(await verifySignature(raw, sig))) {
    return new NextResponse("invalid_signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("bad_json", { status: 400 });
  }

  let any = false;
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const businessPhone = value.metadata?.phone_number_id ?? cfg.phoneNumberId;
      for (const msg of value.messages ?? []) {
        if (msg.type !== "text") continue;
        const text = msg.text?.body?.trim();
        if (!text || !msg.from || !msg.id) continue;
        await persistInbound({
          from: msg.from,
          to: businessPhone,
          body: text,
          waMessageId: msg.id,
        });
        any = true;
      }
    }
  }

  if (any) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }
  // Meta needs a 200 quickly even on no-op events
  return NextResponse.json({ ok: true });
}
