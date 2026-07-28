import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("=== 1. Testing Hero Banners Database Query ===");
  const banners = await prisma.heroBanner.findMany({
    orderBy: { order: "asc" },
  });

  console.log(`Found ${banners.length} hero banners in DB:`);
  banners.forEach((b, idx) => {
    console.log(`[${idx + 1}] ID: ${b.id}`);
    console.log(`    Title: ${b.title}`);
    console.log(`    Category: ${b.categorySlug} | Link: ${b.buttonLink}`);
    console.log(`    Order: ${b.order} | Active: ${b.isActive}`);
  });

  console.log("\n=== 2. Testing Home Active Banners Query ===");
  const activeBanners = await prisma.heroBanner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  console.log(`Found ${activeBanners.length} active banners for Home Carousel.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
