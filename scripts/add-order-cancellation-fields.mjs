import { config as dotenvConfig } from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error("DATABASE_URL not set. Run `npx vercel env pull .env.local` first.");
  process.exit(1);
}

const sql = neon(url);

await sql.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp`);
console.log("✓ orders.cancelled_at ensured");

await sql.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "cancellation_reason" text`);
console.log("✓ orders.cancellation_reason ensured");

console.log("\nDone.");
