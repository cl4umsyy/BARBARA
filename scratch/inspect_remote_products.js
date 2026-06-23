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
    console.log("Fetching products from remote Supabase database...");
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, is_active");

    if (error) {
      console.error("Error:", error);
    } else {
      console.log(`Found ${products.length} products on remote:`);
      products.forEach(p => {
        console.log(`- ID: ${p.id}, Slug: ${p.slug}, Name: ${p.name}, Active: ${p.is_active}`);
      });
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
