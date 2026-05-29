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

await sql.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`);
console.log("✓ orders.deleted_at ensured");

await sql.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "deleted_by" integer`);
console.log("✓ orders.deleted_by ensured");

await sql.query(`
  CREATE TABLE IF NOT EXISTS audit_events (
    id serial PRIMARY KEY,
    actor_id integer,
    actor_username text,
    actor_role text,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text NOT NULL,
    "before" jsonb,
    "after" jsonb,
    metadata jsonb,
    created_at timestamp NOT NULL DEFAULT now()
  )
`);
console.log("✓ audit_events table ensured");

await sql.query(`CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events (actor_id)`);
console.log("✓ audit_events.actor_id index ensured");

await sql.query(`CREATE INDEX IF NOT EXISTS audit_events_target_idx ON audit_events (target_type, target_id)`);
console.log("✓ audit_events composite index ensured");

await sql.query(`CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at DESC)`);
console.log("✓ audit_events.created_at index ensured");

console.log("\nDone.");
