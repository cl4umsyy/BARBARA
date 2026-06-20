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
    console.log("Checking columns of addresses by inserting dummy record...");
    // Let's select one row from addresses to see its columns
    const { data: addresses, error } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Error reading addresses:", error);
    } else {
      console.log("Remote addresses table columns:", addresses.length > 0 ? Object.keys(addresses[0]) : "Empty table, trying select of individual columns...");
      
      // Since it's empty, let's test specific columns by selecting them
      const testColumns = async (cols) => {
        const { error: testErr } = await supabaseAdmin
          .from("addresses")
          .select(cols.join(','))
          .limit(1);
        return { cols, success: !testErr, error: testErr };
      };

      console.log("Testing standard columns...");
      console.log(await testColumns(["id", "user_id", "label", "recipient_name", "phone", "street", "city", "province", "postal_code", "is_default"]));
      
      console.log("Testing district...");
      console.log(await testColumns(["district"]));

      console.log("Testing address_detail...");
      console.log(await testColumns(["address_detail"]));

      console.log("Testing created_at...");
      console.log(await testColumns(["created_at"]));
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
