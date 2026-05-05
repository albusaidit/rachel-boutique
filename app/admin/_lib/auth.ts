import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  authenticate,
  countAdminUsers,
  ensureBootstrapUser,
  findAdminUserById,
  type AdminUser,
} from "@/app/_lib/db/users-repo";

const SESSION_COOKIE = "rachel_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const FALLBACK_SECRET = "rachel-dev-secret-change-in-production";

function getSecret(): string {
  return process.env.ADMIN_SECRET || FALLBACK_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function makeToken(userId: number | "legacy"): string {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(8).toString("hex");
  const payload = `${userId}.${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function parseToken(
  token: string | undefined,
): { userId: string; issuedAt: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, issuedAt, nonce, mac] = parts;
  const payload = `${userId}.${issuedAt}.${nonce}`;
  const expected = sign(payload);
  if (mac.length !== expected.length) return null;
  if (
    !timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(expected, "hex"))
  ) {
    return null;
  }
  const issuedSeconds = Number(issuedAt);
  if (!Number.isFinite(issuedSeconds)) return null;
  const ageSeconds = Math.floor(Date.now() / 1000) - issuedSeconds;
  if (ageSeconds < 0 || ageSeconds > MAX_AGE_SECONDS) return null;
  return { userId, issuedAt: issuedSeconds };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return parseToken(store.get(SESSION_COOKIE)?.value) !== null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const parsed = parseToken(store.get(SESSION_COOKIE)?.value);
  return parsed?.userId ?? null;
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const id = await getCurrentUserId();
  if (!id || id === "legacy") return null;
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) return null;
  return findAdminUserById(numeric);
}

export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<{ ok: true; user: AdminUser } | { ok: false; reason: string }> {
  const u = username.trim().toLowerCase();
  if (!u || !password) return { ok: false, reason: "missing_credentials" };

  // Bootstrap path: if no users exist yet, allow ADMIN_USERNAME / ADMIN_PASSWORD env login,
  // and create that user as owner.
  const userCount = await countAdminUsers();
  if (userCount === 0) {
    const envUser = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD || "rachel-admin";
    if (u !== envUser || password !== envPass) {
      return { ok: false, reason: "invalid_credentials" };
    }
    const created = await ensureBootstrapUser(u, password);
    if (!created) return { ok: false, reason: "bootstrap_failed" };
    await issueSession(created.id);
    return { ok: true, user: created };
  }

  // Normal path: look up user, verify password
  const user = await authenticate(u, password);
  if (!user) return { ok: false, reason: "invalid_credentials" };
  await issueSession(user.id);
  return { ok: true, user };
}

async function issueSession(userId: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(userId), {
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

// Legacy single-password helper, kept for backward compatibility
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return input === "rachel-admin";
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
