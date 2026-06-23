const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log("=== Checking reviews table schema cache/columns on Supabase ===");
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase query error:", error);
  } else {
    console.log("Supabase select reviews result data keys:", data.length > 0 ? Object.keys(data[0]) : "No data, but table exists.");
  }
}

main().catch(console.error);
