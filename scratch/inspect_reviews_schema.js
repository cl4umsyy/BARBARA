const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log("=== Inspecting Remote Reviews Table ===");
  const { data: remoteReviews, error: remoteError } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .limit(1);

  if (remoteError) {
    console.error("Remote reviews query error:", remoteError);
  } else {
    console.log("Remote reviews sample row keys:", remoteReviews.length > 0 ? Object.keys(remoteReviews[0]) : "Empty table (no rows)");
    // Try to get structure if empty
    if (remoteReviews.length === 0) {
      console.log("Remote reviews table exists but is empty.");
    }
  }

  console.log("\n=== Inspecting Local Reviews Table ===");
  const client = await pool.connect();
  try {
    const localReviewsRes = await client.query("SELECT * FROM reviews LIMIT 1");
    console.log("Local reviews sample row keys:", localReviewsRes.rows.length > 0 ? Object.keys(localReviewsRes.rows[0]) : "Empty table");
    
    const columnsRes = await client.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'reviews'`
    );
    console.log("Local reviews columns:");
    columnsRes.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable})`);
    });
  } catch (err) {
    console.error("Local database error:", err);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
