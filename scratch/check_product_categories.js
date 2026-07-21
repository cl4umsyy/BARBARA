const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gyargxxfsuzhepumcynf.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YXJneHhmc3V6aGVwdW1jeW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyNjAwOCwiZXhwIjoyMDk3NDAyMDA4fQ.Bo80woTgULEf5cKirqEqV-vokA9ItKfeyTIu8ka0zfQ";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category_id, category, categories(id, name, slug)')
    .limit(10);

  if (error) {
    console.error('Error fetching products:', error);
  } else {
    console.log('Sample products:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProducts();
