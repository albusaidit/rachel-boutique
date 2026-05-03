import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Run `npx vercel env pull .env.local` first.",
  );
}

export default defineConfig({
  schema: "./app/_lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
