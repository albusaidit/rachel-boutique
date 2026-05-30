import { config as dotenvConfig } from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const sql = neon(url);

await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
console.log("✓ products.deleted_at ensured");

await sql.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "deleted_by" integer`);
console.log("✓ products.deleted_by ensured");

console.log("\nDone.");
