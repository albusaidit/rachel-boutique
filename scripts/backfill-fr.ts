import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fall back to .env
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, isNull, or } from "drizzle-orm";
import * as schema from "../app/_lib/db/schema";

// French name + description for every seeded product. Applied only where the
// product is currently missing a French name, so existing translations and any
// admin edits are never overwritten.
const FR: Record<string, { nameFr: string; descFr: string }> = {
  "c-abaya-01": {
    nameFr: "Abaya en soie brodée",
    descFr: "Abaya en soie naturelle, broderie main à l'épaule et aux poignets. Pour les grandes occasions.",
  },
  "c-abaya-02": {
    nameFr: "Abaya beige aux perles",
    descFr: "Coupe moderne et fluide avec de délicats détails perlés au col.",
  },
  "c-mukhawar-01": {
    nameFr: "Mukhawar brodé d'or",
    descFr: "Mukhawar émirati traditionnel, fil d'or cousu main.",
  },
  "c-mukhawar-02": {
    nameFr: "Mukhawar de mariage ivoire",
    descFr: "Pièce de cérémonie, broderie raffinée sur soie ivoire.",
  },
  "c-tunic-01": {
    nameFr: "Tunique oversize en lin",
    descFr: "Lin belge léger, coupe décontractée pour la maison et au-delà.",
  },
  "c-blouse-01": {
    nameFr: "Blouse portefeuille en soie",
    descFr: "Soie pure, élégante coupe portefeuille.",
  },
  "c-shirt-01": {
    nameFr: "Chemise classique en coton",
    descFr: "Coton égyptien longues fibres, coupe décontractée.",
  },
  "c-pants-01": {
    nameFr: "Pantalon large en laine",
    descFr: "Laine italienne, taille haute, silhouette large et épurée.",
  },
  "c-skirt-01": {
    nameFr: "Jupe mi-longue plissée",
    descFr: "Plissé fin, mouvement naturel à chaque pas.",
  },
  "c-trench-01": {
    nameFr: "Trench léger beige",
    descFr: "Tissu italien, trench classique pour les mi-saisons.",
  },
  "c-coat-01": {
    nameFr: "Manteau long en laine à ceinture",
    descFr: "Laine vierge italienne, silhouette ample, ceinture assortie.",
  },
  "c-swim-01": {
    nameFr: "Maillot de bain couvrant",
    descFr: "Tissu résistant au chlore, coupe pudique et confortable.",
  },
  "s-heels-01": {
    nameFr: "Escarpins en cuir nude",
    descFr: "Cuir italien, talon 8 cm, confort toute la journée.",
  },
  "s-sneakers-01": {
    nameFr: "Baskets blanches en cuir",
    descFr: "Design épuré, cuir écoresponsable.",
  },
  "s-sandals-01": {
    nameFr: "Sandales à brides croisées",
    descFr: "Sandale plate et confortable pour l'été et les voyages.",
  },
  "s-boots-01": {
    nameFr: "Bottes hautes",
    descFr: "Cuir italien, hauteur genou, talon moyen.",
  },
  "s-slippers-01": {
    nameFr: "Babouches brodées",
    descFr: "Babouches d'intérieur confortables, broderie main raffinée.",
  },
  "s-heels-02": {
    nameFr: "Escarpins noirs à bout pointu",
    descFr: "Un classique infaillible. Cuir véritable souple.",
  },
  "h-dryer-01": {
    nameFr: "Sèche-cheveux ionique professionnel",
    descFr: "Technologie ionique, 3 niveaux de chaleur, garantie 2 ans.",
  },
  "h-straight-01": {
    nameFr: "Lisseur en céramique",
    descFr: "Plaques céramique 30 cm, jusqu'à 230 °C.",
  },
  "h-curler-01": {
    nameFr: "Boucleur automatique",
    descFr: "Boucles automatiques en un bouton, ondulations naturelles longue tenue.",
  },
  "b-oil-01": {
    nameFr: "Huile d'argan 100 % pure",
    descFr: "Huile d'argan marocaine pressée à froid, pour cheveux et peau.",
  },
  "b-oil-02": {
    nameFr: "Huile capillaire indienne à l'amla",
    descFr: "Fortifie les cheveux et stimule la pousse, recette indienne authentique.",
  },
  "b-shea-01": {
    nameFr: "Beurre de karité brut africain",
    descFr: "Beurre de karité non raffiné du Ghana, pour peau sèche et cheveux.",
  },
  "b-mask-01": {
    nameFr: "Masque capillaire au henné indien",
    descFr: "Henné indien 100 % naturel, nutrition et brillance immédiates.",
  },
  "b-hair-01": {
    nameFr: "Sérum nourrissant pour cheveux",
    descFr: "Protection thermique et brillance naturelle sans effet gras.",
  },
  "b-oil-03": {
    nameFr: "Huile de nigelle",
    descFr: "Huile de nigelle égyptienne pressée à froid.",
  },
  "p-oud-01": {
    nameFr: "Oud Royal",
    descFr: "Oud cambodgien d'exception, notes chaudes et longue tenue.",
  },
  "p-musk-01": {
    nameFr: "Musc Blanc",
    descFr: "Musc pur et doux qui dure toute la journée.",
  },
  "p-attar-01": {
    nameFr: "Attar de rose de Taïf",
    descFr: "Véritable attar de rose de Taïf — le printemps en flacon.",
  },
  "p-floral-01": {
    nameFr: "Nuit de Jasmin",
    descFr: "Jasmin de Damas sur un cœur de vanille, pour les soirées.",
  },
};

async function main() {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) throw new Error("DATABASE_URL not set (check .env.local)");
  const db = drizzle(neon(url), { schema });

  let updated = 0;
  let skipped = 0;
  for (const [id, t] of Object.entries(FR)) {
    // Only fill products that don't already have a French name.
    const res = await db
      .update(schema.products)
      .set({ nameFr: t.nameFr, descFr: t.descFr, updatedAt: new Date() })
      .where(
        and(
          eq(schema.products.id, id),
          or(isNull(schema.products.nameFr), eq(schema.products.nameFr, "")),
        ),
      )
      .returning({ id: schema.products.id });
    if (res.length) {
      updated += 1;
      console.log(`  ✓ FR set: ${id} → ${t.nameFr}`);
    } else {
      skipped += 1;
    }
  }
  console.log(
    `\nDone. Filled French on ${updated} product(s); skipped ${skipped} (already translated or not present).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
