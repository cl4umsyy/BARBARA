const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const userId = '26068fb1-8c35-4d6c-be75-8836c05a04c9'; // tester1@example.com
  const orderId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
  
  console.log("Creating test order in Supabase...");
  
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      id: orderId,
      order_number: 'BBR-TEST-ORDER-777',
      status: 'DELIVERED',
      subtotal: 150000,
      shipping_cost: 0,
      total: 150000,
      payment_method: 'Midtrans',
      payment_status: 'PAID',
      user_id: userId
    })
    .select();

  if (orderErr) {
    console.error("Error creating order:", orderErr);
    return;
  }
  
  console.log("Order created successfully:", order);

  console.log("Creating test order item...");
  const { data: item, error: itemErr } = await supabaseAdmin
    .from("order_items")
    .insert({
      id: 'b1c2d3e4-f5a6-7b8c-9d0e-f1a2b3c4d5e6',
      order_id: orderId,
      product_name: 'baju ambarawa',
      size: 'M',
      color: 'Hitam',
      quantity: 1,
      price: 150000,
      variant_id: '5a1bf285-7ea8-477a-84d3-d374c5a09896'
    })
    .select();

  if (itemErr) {
    console.error("Error creating order item:", itemErr);
    return;
  }

  console.log("Order item created successfully:", item);
}

main().catch(console.error);
