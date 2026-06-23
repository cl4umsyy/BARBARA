const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const userId = '26068fb1-8c35-4d6c-be75-8836c05a04c9'; // tester1@example.com
  const orderId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
  const productId = '33c0b0ed-fbd8-4393-b1fa-8b2282ad3063'; // baju ambarawa

  console.log("=== Testing Order Query Logic ===");
  // 1. Fetch order
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  console.log("Order fetch result:", { order, orderError });

  // 2. Fetch order items
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select(`
      id,
      variant:product_variants (
        product_id
      )
    `)
    .eq("order_id", orderId);

  console.log("Order items fetch result:", { orderItems, itemsError });

  const hasProduct = orderItems?.some((item) => {
    const rawVariant = item.variant;
    const variant = Array.isArray(rawVariant) ? rawVariant[0] : rawVariant;
    return variant?.product_id === productId;
  });

  console.log("Has product in order items?", hasProduct);
}

main().catch(console.error);
