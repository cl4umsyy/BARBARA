const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gyargxxfsuzhepumcynf.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY!");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  try {
    console.log("Fetching users from Supabase...");
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role");

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      console.log("Users in Supabase:");
      console.log(users);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
