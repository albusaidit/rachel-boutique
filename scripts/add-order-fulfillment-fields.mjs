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

const cols = [
  ["email", "text"],
  ["tracking_number", "text"],
  ["carrier", "text"],
  ["shipping_notes", "text"],
  ["confirmed_at", "timestamp"],
  ["shipped_at", "timestamp"],
  ["delivered_at", "timestamp"],
];

for (const [name, type] of cols) {
  await sql`SELECT 1`; // warm
  await sql.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS "${name}" ${type}`,
  );
  console.log(`✓ orders.${name} ensured`);
}

console.log("\nDone.");
