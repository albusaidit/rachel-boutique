import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;
const N = 16384;
const R = 8;
const P = 1;

export function hashPassword(password: string): string {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const test = scryptSync(password, salt, expected.length, { N: n, r, p });
  if (test.length !== expected.length) return false;
  return timingSafeEqual(test, expected);
}
