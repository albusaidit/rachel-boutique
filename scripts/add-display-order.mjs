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

await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0`;
console.log("✓ Column display_order ensured");

const r = await sql`
  UPDATE products
  SET display_order = sub.rn
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name_en) - 1 AS rn FROM products
  ) sub
  WHERE products.id = sub.id
  RETURNING products.id
`;
console.log(`✓ Seeded display_order on ${r.length} products`);
