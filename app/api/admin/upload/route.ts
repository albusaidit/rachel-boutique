import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAuthed } from "@/app/admin/_lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "blob_not_configured" },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeName = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const blob = await put(safeName, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
