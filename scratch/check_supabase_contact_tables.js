const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log("=== Checking contact_information on Supabase ===");
  const { data, error } = await supabaseAdmin
    .from("contact_information")
    .select("*")
    .limit(1);

  console.log("Supabase select result:", { data, error });
}

main().catch(console.error);
