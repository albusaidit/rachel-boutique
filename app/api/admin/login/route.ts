import { NextResponse } from "next/server";
import { checkPassword, login } from "@/app/admin/_lib/auth";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  await login();
  return NextResponse.json({ ok: true });
}
