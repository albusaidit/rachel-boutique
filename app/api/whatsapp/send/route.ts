import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/app/admin/_lib/auth";
import { isConfigured, sendText } from "@/app/_lib/whatsapp/client";

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ error: "whatsapp_not_configured" }, { status: 503 });
  }

  let to = "";
  let body = "";
  let orderId: number | null = null;
  try {
    const json = await req.json();
    to = typeof json?.to === "string" ? json.to : "";
    body = typeof json?.body === "string" ? json.body : "";
    if (typeof json?.orderId === "number" && Number.isFinite(json.orderId)) {
      orderId = json.orderId;
    }
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!to || !body.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.length > 4096) {
    return NextResponse.json({ error: "body_too_long" }, { status: 413 });
  }

  const result = await sendText(to, body, { orderId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  revalidatePath("/admin/orders");
  return NextResponse.json({ ok: true, id: result.id });
}
