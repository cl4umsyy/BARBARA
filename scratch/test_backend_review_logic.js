const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('../src/generated/prisma/client'); // path to generated prisma client
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const prisma = require('../src/lib/prisma').default;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const userId = '26068fb1-8c35-4d6c-be75-8836c05a04c9'; // tester1@example.com
  const orderId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
  const productId = '33c0b0ed-fbd8-4393-b1fa-8b2282ad3063'; // baju ambarawa
  const rating = 5;
  const reviewText = "TEST REVIEW COMMENT FROM AUTOMATED SCRIPT";
  const reviewImages = ["https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"];

  console.log("=== SIMULATING BACKEND REVIEW LOGIC ===");

  // 1. Fetch order from remote Supabase
  console.log(`[Step 1] Fetching order ${orderId} for user ${userId} from Supabase...`);
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, total, subtotal, shipping_cost, user_id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (orderError || !order) {
    console.error("Order not found or query error:", orderError);
    return;
  }
  console.log("Order found:", order);

  // 2. Verify product in order items from Supabase
  console.log(`[Step 2] Verifying product ${productId} in order items...`);
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select(`
      id,
      variant:product_variants (
        product_id
      )
    `)
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("Items query error:", itemsError);
    return;
  }

  const hasProduct = orderItems?.some((item) => {
    const rawVariant = item.variant;
    const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
    return variant?.product_id === productId;
  });

  if (!hasProduct) {
    console.error("Product not found in order items!");
    return;
  }
  console.log("Product verification: SUCCESS");

  // 3. Resolve constraints locally: insert placeholder User and Order
  console.log(`[Step 3] Ensuring user and order exist in local Postgres...`);
  
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      name: "Tester One",
      email: "tester1@example.com",
    },
    create: {
      id: userId,
      name: "Tester One",
      email: "tester1@example.com",
      password: "placeholder_hash",
      role: "CUSTOMER",
    }
  });
  console.log("Local User checked/created.");

  let localStatus = "DELIVERED";
  const remoteStatus = order.status?.toUpperCase();
  if (remoteStatus === "COMPLETED" || remoteStatus === "SELESAI") {
    localStatus = "COMPLETED";
  }

  await prisma.order.upsert({
    where: { id: orderId },
    update: {
      status: localStatus,
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      shippingCost: order.shipping_cost || 0,
    },
    create: {
      id: orderId,
      userId: userId,
      orderNumber: order.order_number || `ORD-${orderId.substring(0, 8).toUpperCase()}`,
      status: localStatus,
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      shippingCost: order.shipping_cost || 0,
    }
  });
  console.log("Local Order checked/created.");

  // 4. Remote reviews upsert
  const reviewId = 'test-review-uuid-12345';
  console.log(`[Step 4] Upserting review remote with ID ${reviewId}...`);
  const { error: remoteUpsertError } = await supabaseAdmin
    .from("reviews")
    .upsert({
      id: reviewId,
      user_id: userId,
      order_id: orderId,
      product_id: productId,
      rating,
      review: reviewText,
      review_images: reviewImages,
      updated_at: new Date().toISOString()
    });

  if (remoteUpsertError) {
    console.error("Remote upsert failed:", remoteUpsertError);
    return;
  }
  console.log("Remote review upsert: SUCCESS");

  // 5. Local reviews upsert
  console.log(`[Step 5] Upserting review locally via Prisma...`);
  const reviewObj = await prisma.review.upsert({
    where: {
      id: reviewId
    },
    update: {
      rating,
      review: reviewText,
      reviewImages,
    },
    create: {
      id: reviewId,
      userId,
      orderId,
      productId,
      rating,
      review: reviewText,
      reviewImages,
    }
  });

  console.log("Local review upsert: SUCCESS", reviewObj);
  console.log("=== SIMULATION SUCCESSFUL ===");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
