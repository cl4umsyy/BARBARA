import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log("Fetching products via prisma.product.findMany...");
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, isActive: true }
  });
  console.log(`Found ${products.length} products:`);
  products.forEach(p => {
    console.log(`- ID: ${p.id}, Slug: ${p.slug}, Name: ${p.name}, Active: ${p.isActive}`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
