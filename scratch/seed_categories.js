const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gyargxxfsuzhepumcynf.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YXJneHhmc3V6aGVwdW1jeW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyNjAwOCwiZXhwIjoyMDk3NDAyMDA4fQ.Bo80woTgULEf5cKirqEqV-vokA9ItKfeyTIu8ka0zfQ";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const newCategories = [
  { name: "Tops", slug: "tops", description: "Koleksi atasan BARBARA: Kaos, Kemeja, Jaket, Hoodie." },
  { name: "Bottoms", slug: "bottoms", description: "Koleksi bawahan BARBARA: Celana panjang, pendek, jeans." },
  { name: "Outerwear", slug: "outerwear", description: "Koleksi luaran BARBARA: Jaket tebal, mantel, bomber." }
];

async function seedCategories() {
  console.log("Checking and inserting new categories...");
  for (const cat of newCategories) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", cat.slug)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from("categories")
        .insert([cat])
        .select();

      if (error) {
        console.error(`Error inserting category ${cat.name}:`, error);
      } else {
        console.log(`✓ Created category: ${cat.name} (${cat.slug})`);
      }
    } else {
      console.log(`- Category ${cat.name} already exists. Skipped.`);
    }
  }

  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  console.log("\nAll categories in DB now:");
  console.table(allCategories);
}

seedCategories();
