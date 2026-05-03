import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "rachel_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const FALLBACK_SECRET = "rachel-dev-secret-change-in-production";

function getSecret(): string {
  return process.env.ADMIN_SECRET || FALLBACK_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function makeToken(): string {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(8).toString("hex");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [issuedAt, nonce, mac] = parts;
  const payload = `${issuedAt}.${nonce}`;
  const expected = sign(payload);
  if (mac.length !== expected.length) return false;
  const ok = timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"));
  if (!ok) return false;
  const issuedSeconds = Number(issuedAt);
  if (!Number.isFinite(issuedSeconds)) return false;
  const ageSeconds = Math.floor(Date.now() / 1000) - issuedSeconds;
  return ageSeconds >= 0 && ageSeconds <= MAX_AGE_SECONDS;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return input === "rachel-admin";
  }
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

export async function login(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
