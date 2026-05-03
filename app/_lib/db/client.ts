import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type DB = NeonHttpDatabase<typeof schema>;

let cached: DB | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function getDb(): DB {
  if (cached) return cached;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Run `npx vercel env pull .env.local` or set it manually before reading from the database.",
    );
  }
  const sql = neon(url);
  cached = drizzle(sql, { schema }) as DB;
  return cached;
}

export { schema };
