import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "shipping_addresses",
      "order_items",
      "orders",
      "cart_items",
      "carts",
      "wishlists",
      "product_images",
      "product_variants",
      "products",
      "categories",
      "addresses",
      "users"
    RESTART IDENTITY CASCADE;
  `);

  const [adminPassword, customerPassword] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Customer123!", 10),
  ]);

  await prisma.user.createMany({
    data: [
      {
        name: "BARBARA Admin",
        email: "admin@barbara.com",
        password: adminPassword,
        role: Role.ADMIN,
      },
      {
        name: "BARBARA Customer",
        email: "customer@barbara.com",
        password: customerPassword,
        role: Role.USER,
      },
    ],
  });

  const topsCategory = await prisma.category.create({
    data: {
      name: "Tops",
      slug: "tops",
      description: "Atasan Unisex BARBARA",
    },
  });

  await prisma.product.create({
    data: {
      name: "BARBARA Oversized Noir Tee",
      slug: "barbara-oversized-noir-tee",
      description:
        "Kaos oversized katun premium berwarna hitam dengan detail visual yang bold.",
      price: 299000,
      material: "100% Heavyweight Cotton 24s",
      care: "Cuci dengan air dingin, jangan disetrika pada bagian print.",
      categoryId: topsCategory.id,
      variants: {
        create: [
          {
            size: "M",
            color: "Black",
            colorHex: "#000000",
            stock: 15,
            sku: "BBR-TEE-BLK-M",
          },
          {
            size: "L",
            color: "Black",
            colorHex: "#000000",
            stock: 20,
            sku: "BBR-TEE-BLK-L",
          },
          {
            size: "XL",
            color: "Black",
            colorHex: "#000000",
            stock: 10,
            sku: "BBR-TEE-BLK-XL",
          },
        ],
      },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
            alt: "Front view",
            order: 0,
          },
        ],
      },
    },
  });

  console.log("Seeding completed.");
  console.log("Admin: admin@barbara.com / Admin123!");
  console.log("Customer: customer@barbara.com / Customer123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
