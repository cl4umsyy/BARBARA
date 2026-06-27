const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gyargxxfsuzhepumcynf.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  try {
    console.log("Inspecting orders table...");
    const { data: orders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .limit(1);

    if (orderError) {
      console.error("Orders table error:", orderError);
    } else {
      console.log("Orders table columns:", orders.length > 0 ? Object.keys(orders[0]) : "Empty table");
      console.log("Full sample order data:", orders[0]);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
