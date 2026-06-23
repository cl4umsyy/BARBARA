const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const userId = 'a212da68-467f-45b6-a439-0fc94aa2d0b6'; // fleasobased@gmail.com
  const { data: orders, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      order_items (
        id,
        product_name,
        variant_id,
        product_variants (
          product_id
        )
      )
    `)
    .eq("user_id", userId);

  if (orderErr) {
    console.error(orderErr);
    return;
  }

  console.log("Orders & items for user:", JSON.stringify(orders, null, 2));
}

main().catch(console.error);
