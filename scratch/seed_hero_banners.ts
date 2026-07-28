import "dotenv/config";
import prisma from "../src/lib/prisma";

const INITIAL_HERO_BANNERS = [
  {
    title: "Oversized Streetwear Core",
    description: "Koleksi Kaos & Tops Oversized Heavyweight Premium Barbara",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600",
    buttonText: "Belanja Tops",
    categorySlug: "tops",
    buttonLink: "/shop?category=tops",
    order: 1,
    isActive: true,
  },
  {
    title: "Cyberpunk & Techwear Outerwear",
    description: "Jaket Ripstop & Heavy Puffer dengan Monokrom Cutting Presisi",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600",
    buttonText: "Lihat Outerwear",
    categorySlug: "outerwear",
    buttonLink: "/shop?category=outerwear",
    order: 2,
    isActive: true,
  },
  {
    title: "Minimalist Utility Bottoms",
    description: "Celana Cargo Heavyweight & Utility Shorts untuk Streetwear Harian",
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600",
    buttonText: "Jelajahi Bottoms",
    categorySlug: "bottoms",
    order: 3,
    isActive: true,
  },
];

async function main() {
  const count = await prisma.heroBanner.count();
  if (count === 0) {
    console.log("Seeding initial default hero banners...");
    await prisma.heroBanner.createMany({
      data: INITIAL_HERO_BANNERS,
    });
    console.log("Seeded 3 default hero banners successfully!");
  } else {
    console.log(`Table hero_banners already has ${count} records.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
