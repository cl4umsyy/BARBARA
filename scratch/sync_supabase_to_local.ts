import "dotenv/config";
import { supabaseAdmin } from "../src/lib/supabase";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("=== STARTING SUPABASE TO LOCAL DB SYNC ===");

  // Clean local tables to avoid unique constraint violations (e.g. slug, sku)
  console.log("Cleaning local catalog and product tables...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "shipping_addresses",
      "order_items",
      "orders",
      "cart_items",
      "carts",
      "wishlists",
      "reviews",
      "product_images",
      "product_variants",
      "products",
      "categories"
    RESTART IDENTITY CASCADE;
  `);
  console.log("Local tables cleaned.");

  // 1. Sync Categories
  console.log("Fetching categories from Supabase...");
  const { data: remoteCategories, error: catError } = await supabaseAdmin
    .from("categories")
    .select("*");

  if (catError) {
    console.error("Failed to fetch categories:", catError);
    process.exit(1);
  }

  console.log(`Found ${remoteCategories.length} categories. Upserting into local database...`);
  for (const cat of remoteCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        imageUrl: cat.image,
        description: cat.description,
      },

      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        imageUrl: cat.image,
        description: cat.description,
      }
    });
  }
  console.log("Categories synced!");

  // 2. Sync Products
  console.log("Fetching products from Supabase...");
  const { data: remoteProducts, error: prodError } = await supabaseAdmin
    .from("products")
    .select("*");

  if (prodError) {
    console.error("Failed to fetch products:", prodError);
    process.exit(1);
  }

  console.log(`Found ${remoteProducts.length} products. Upserting into local database...`);
  for (const p of remoteProducts) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        material: p.material,
        care: p.care,
        isNew: p.is_new,
        isActive: p.is_active,
        createdAt: new Date(p.created_at),
        categoryId: p.category_id,
        brand: p.brand || "Vintage",
        condition: p.condition || "Baik",
        likesCount: p.likes_count || 0,
        categorySlug: p.category || null,
        size: p.size || null,
        color: p.color || null,
      },
      create: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        material: p.material,
        care: p.care,
        isNew: p.is_new,
        isActive: p.is_active,
        createdAt: new Date(p.created_at),
        categoryId: p.category_id,
        brand: p.brand || "Vintage",
        condition: p.condition || "Baik",
        likesCount: p.likes_count || 0,
        categorySlug: p.category || null,
        size: p.size || null,
        color: p.color || null,
      }
    });
  }
  console.log("Products synced!");

  // 3. Sync Product Variants
  console.log("Fetching product variants from Supabase...");
  const { data: remoteVariants, error: varError } = await supabaseAdmin
    .from("product_variants")
    .select("*");

  if (varError) {
    console.error("Failed to fetch variants:", varError);
    process.exit(1);
  }

  console.log(`Found ${remoteVariants.length} variants. Upserting into local database...`);
  for (const v of remoteVariants) {
    await prisma.productVariant.upsert({
      where: { id: v.id },
      update: {
        productId: v.product_id,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex,
        stock: v.stock,
        sku: v.sku,
      },
      create: {
        id: v.id,
        productId: v.product_id,
        size: v.size,
        color: v.color,
        colorHex: v.color_hex,
        stock: v.stock,
        sku: v.sku,
      }
    });
  }
  console.log("Product variants synced!");

  // 4. Sync Product Images
  console.log("Fetching product images from Supabase...");
  const { data: remoteImages, error: imgError } = await supabaseAdmin
    .from("product_images")
    .select("*");

  if (imgError) {
    console.error("Failed to fetch images:", imgError);
    process.exit(1);
  }

  console.log(`Found ${remoteImages.length} images. Upserting into local database...`);
  for (const img of remoteImages) {
    await prisma.productImage.upsert({
      where: { id: img.id },
      update: {
        productId: img.product_id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      },
      create: {
        id: img.id,
        productId: img.product_id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      }
    });
  }
  console.log("Product images synced!");

  // 5. Sync Reviews
  console.log("Fetching reviews from Supabase...");
  const { data: remoteReviews, error: revError } = await supabaseAdmin
    .from("reviews")
    .select("*");

  if (revError) {
    console.warn("Failed to fetch reviews (might not exist yet):", revError.message);
  } else {
    console.log(`Found ${remoteReviews.length} reviews. Upserting into local database...`);
    for (const r of remoteReviews) {
      await prisma.review.upsert({
        where: { id: r.id },
        update: {
          userId: r.user_id,
          orderId: r.order_id,
          productId: r.product_id,
          rating: r.rating,
          review: r.review,
          reviewImages: r.review_images || [],
          isShown: r.is_shown ?? true,
          adminReply: r.admin_reply || null,
          adminRepliedAt: r.admin_replied_at ? new Date(r.admin_replied_at) : null,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at || r.created_at),
        },
        create: {
          id: r.id,
          userId: r.user_id,
          orderId: r.order_id,
          productId: r.product_id,
          rating: r.rating,
          review: r.review,
          reviewImages: r.review_images || [],
          isShown: r.is_shown ?? true,
          adminReply: r.admin_reply || null,
          adminRepliedAt: r.admin_replied_at ? new Date(r.admin_replied_at) : null,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at || r.created_at),
        }
      });
    }
    console.log("Reviews synced!");
  }

  console.log("=== DB SYNC COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

main().catch(err => {
  console.error("Error during sync:", err);
  process.exit(1);
});
