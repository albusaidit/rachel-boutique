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

await sql.query(`
  CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id serial PRIMARY KEY,
    order_id integer,
    direction text NOT NULL,
    from_phone text NOT NULL,
    to_phone text NOT NULL,
    body text NOT NULL,
    template_name text,
    wa_message_id text,
    status text NOT NULL DEFAULT 'sent',
    error text,
    created_at timestamp NOT NULL DEFAULT now()
  )
`);
console.log("✓ whatsapp_messages table ensured");

await sql.query(`CREATE INDEX IF NOT EXISTS whatsapp_messages_order_idx ON whatsapp_messages (order_id)`);
console.log("✓ whatsapp_messages.order_id index ensured");

await sql.query(`CREATE INDEX IF NOT EXISTS whatsapp_messages_from_idx ON whatsapp_messages (from_phone)`);
console.log("✓ whatsapp_messages.from_phone index ensured");

console.log("\nDone.");
