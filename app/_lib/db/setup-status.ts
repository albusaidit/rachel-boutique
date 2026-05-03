import "server-only";
import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "./client";

export type SetupStatus = {
  dbConnected: boolean;
  adminPasswordSet: boolean;
  sessionSecretSet: boolean;
  schemaPushed: boolean;
  productsSeeded: boolean;
  settingsConfigured: boolean;
  productCount: number;
};

export async function getSetupStatus(): Promise<SetupStatus> {
  const dbConnected = isDbConfigured();
  const adminPasswordSet = Boolean(process.env.ADMIN_PASSWORD);
  const sessionSecretSet = Boolean(process.env.ADMIN_SECRET);

  let schemaPushed = false;
  let productCount = 0;
  let settingsConfigured = false;

  if (dbConnected) {
    try {
      const r = await getDb().execute(
        sql`select count(*)::int as count from products`,
      );
      const rows = (r as unknown as { rows?: Array<{ count: number }> }).rows;
      productCount = rows?.[0]?.count ?? 0;
      schemaPushed = true;
    } catch {
      schemaPushed = false;
    }
    if (schemaPushed) {
      try {
        const r = await getDb().execute(
          sql`select count(*)::int as count from settings`,
        );
        const rows = (r as unknown as { rows?: Array<{ count: number }> }).rows;
        settingsConfigured = (rows?.[0]?.count ?? 0) > 0;
      } catch {
        settingsConfigured = false;
      }
    }
  }

  return {
    dbConnected,
    adminPasswordSet,
    sessionSecretSet,
    schemaPushed,
    productsSeeded: productCount > 0,
    settingsConfigured,
    productCount,
  };
}
