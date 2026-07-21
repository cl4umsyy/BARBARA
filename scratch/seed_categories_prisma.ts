import dotenv from "dotenv";
dotenv.config();

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const newCategories = [
  { name: "Tops", slug: "tops", description: "Koleksi atasan BARBARA: Kaos, Kemeja, Jaket, Hoodie." },
  { name: "Bottoms", slug: "bottoms", description: "Koleksi bawahan BARBARA: Celana panjang, pendek, jeans." },
  { name: "Outerwear", slug: "outerwear", description: "Koleksi luaran BARBARA: Jaket tebal, mantel, bomber." }
];

async function main() {
  console.log("Seeding new categories using Prisma...");
  for (const cat of newCategories) {
    const upsertedCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
    console.log(`✓ Category "${upsertedCat.name}" (id: ${upsertedCat.id}) upserted successfully.`);
  }

  const allCats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  console.log("\nAll categories currently in database:");
  console.table(allCats.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
}

main()
  .catch((e) => {
    console.error("Error seeding categories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
