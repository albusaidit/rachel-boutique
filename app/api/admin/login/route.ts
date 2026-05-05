import { NextResponse } from "next/server";
import { loginWithCredentials } from "@/app/admin/_lib/auth";

export async function POST(req: Request) {
  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = typeof body?.username === "string" ? body.username : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const result = await loginWithCredentials(username, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    user: { username: result.user.username, role: result.user.role },
  });
}
