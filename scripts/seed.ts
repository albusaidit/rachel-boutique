import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../app/_lib/db/schema";
import { products } from "../app/(storefront)/_lib/products";

async function main() {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  const rows = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameAr: p.name.ar,
    nameEn: p.name.en,
    nameFr: p.name.fr ?? null,
    descAr: p.description.ar,
    descEn: p.description.en,
    descFr: p.description.fr ?? null,
    price: p.price,
    compareAt: p.compareAt ?? null,
    currency: p.currency,
    sizes: p.sizes,
    colors: p.colors,
    images: p.images,
    category: p.category,
    subcategory: p.subcategory,
    tags: p.tags,
    stock: p.stock,
  }));

  console.log(`Seeding ${rows.length} products...`);
  for (const row of rows) {
    await db
      .insert(schema.products)
      .values(row)
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          slug: row.slug,
          nameAr: row.nameAr,
          nameEn: row.nameEn,
          nameFr: row.nameFr,
          descAr: row.descAr,
          descEn: row.descEn,
          descFr: row.descFr,
          price: row.price,
          compareAt: row.compareAt,
          currency: row.currency,
          sizes: row.sizes,
          colors: row.colors,
          images: row.images,
          category: row.category,
          subcategory: row.subcategory,
          tags: row.tags,
          stock: row.stock,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✓ Seeded ${rows.length} products.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
