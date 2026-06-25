import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabaseAdmin } from "./src/lib/supabase";
import bcrypt from "bcrypt";

async function main() {
  console.log("Starting Supabase database seeding...");

  // Delete from tables in reverse foreign key order to clean database
  const tables = [
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
  ];

  for (const table of tables) {
    console.log(`Clearing table "${table}"...`);
    const { error } = await supabaseAdmin.from(table).delete().neq("id", "0");
    if (error) {
      console.warn(`Warning clearing table ${table}:`, error.message);
    }
  }

  // 2. Hash passwords
  console.log("Hashing passwords...");
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const customerPassword = await bcrypt.hash("Customer123!", 10);

  // 3. Seed Users
  console.log("Seeding users...");
  const adminId = crypto.randomUUID();
  const customerId = crypto.randomUUID();

  const { error: userErr } = await supabaseAdmin.from("users").insert([
    {
      id: adminId,
      name: "BARBARA Admin",
      email: "admin@barbara.com",
      password: adminPassword,
      role: "ADMIN",
    },
    {
      id: customerId,
      name: "BARBARA Customer",
      email: "customer@barbara.com",
      password: customerPassword,
      role: "USER",
    },
  ]);

  if (userErr) throw userErr;

  // 4. Seed Category
  console.log("Seeding categories...");
  const categoryId = crypto.randomUUID();
  const { error: catErr } = await supabaseAdmin.from("categories").insert({
    id: categoryId,
    name: "Tops",
    slug: "tops",
    description: "Atasan Unisex BARBARA",
  });

  if (catErr) throw catErr;

  // 5. Seed Product
  console.log("Seeding products...");
  const productId = crypto.randomUUID();
  const { error: prodErr } = await supabaseAdmin.from("products").insert({
    id: productId,
    name: "BARBARA Oversized Noir Tee",
    slug: "barbara-oversized-noir-tee",
    description: "Kaos oversized katun premium berwarna hitam dengan detail visual yang bold.",
    price: 299000,
    material: "100% Heavyweight Cotton 24s",
    care: "Cuci dengan air dingin, jangan disetrika pada bagian print.",
    category_id: categoryId,
    is_active: true,
    is_new: true,
  });

  if (prodErr) throw prodErr;

  // 6. Seed Product Variants
  console.log("Seeding product variants...");
  const { error: varErr } = await supabaseAdmin.from("product_variants").insert([
    {
      id: crypto.randomUUID(),
      product_id: productId,
      size: "M",
      color: "Black",
      color_hex: "#000000",
      stock: 15,
      sku: "BBR-TEE-BLK-M",
    },
    {
      id: crypto.randomUUID(),
      product_id: productId,
      size: "L",
      color: "Black",
      color_hex: "#000000",
      stock: 20,
      sku: "BBR-TEE-BLK-L",
    },
    {
      id: crypto.randomUUID(),
      product_id: productId,
      size: "XL",
      color: "Black",
      color_hex: "#000000",
      stock: 10,
      sku: "BBR-TEE-BLK-XL",
    },
  ]);

  if (varErr) throw varErr;

  // 7. Seed Product Images
  console.log("Seeding product images...");
  const { error: imgErr } = await supabaseAdmin.from("product_images").insert({
    id: crypto.randomUUID(),
    product_id: productId,
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
    alt: "Front view",
    order: 0,
  });

  if (imgErr) throw imgErr;

  console.log("\nSeeding completed successfully.");
  console.log("Credentials to log in:");
  console.log(" - Admin: admin@barbara.com / Admin123!");
  console.log(" - Customer: customer@barbara.com / Customer123!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
