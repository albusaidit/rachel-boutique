import { NextResponse } from "next/server";
import { logout } from "@/app/admin/_lib/auth";

export async function POST() {
  await logout();
  return NextResponse.json({ ok: true });
}
