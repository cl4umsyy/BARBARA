const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });

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
    console.log("Inspecting users table...");
    const { data: users, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .limit(1);

    if (userError) {
      console.error("User table error:", userError);
    } else {
      console.log("User table columns:", users.length > 0 ? Object.keys(users[0]) : "Empty table");
    }

    console.log("Inspecting addresses table...");
    const { data: addresses, error: addrError } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .limit(1);

    if (addrError) {
      console.error("Addresses table error:", addrError);
    } else {
      console.log("Addresses table columns:", addresses.length > 0 ? Object.keys(addresses[0]) : "Empty table");
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
