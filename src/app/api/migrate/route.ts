import { NextResponse } from "next/server";
import { Pool } from "pg";

export const revalidate = 0;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "DATABASE_URL environment variable is missing" }, { status: 500 });
  }

  const pool = new Pool({
    connectionString: dbUrl,
  });

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log("[MIGRATION_API]", msg);
    logs.push(msg);
  };

  let client;
  try {
    client = await pool.connect();
    log("Connected to database. Starting unified migration...");

    await client.query("BEGIN");

    // 1. Create contact tables
    log("Creating contact_information table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_information (
        id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        whatsapp TEXT NOT NULL,
        email TEXT NOT NULL,
        business_hours TEXT NOT NULL,
        instagram_url TEXT,
        tiktok_url TEXT,
        facebook_url TEXT,
        google_maps_url TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    log("Creating contact_messages table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    log("Seeding default contact details...");
    await client.query(`
      INSERT INTO contact_information (
        id, 
        store_name, 
        description, 
        address, 
        whatsapp, 
        email, 
        business_hours, 
        instagram_url, 
        tiktok_url, 
        facebook_url, 
        google_maps_url
      ) VALUES (
        'contact_info_default',
        'BARBARA',
        'Premium fashion & thrift store. Handpicked quality products for your everyday curated style.',
        'Jl. Sunan Kudus No. 100, Kudus, Jawa Tengah 59313, Indonesia',
        '6281234567890',
        'contact@barbarastore.com',
        'Senin - Minggu, 09.00 - 21.00 WIB',
        'https://instagram.com/barbara.curated',
        'https://tiktok.com/@barbara.curated',
        'https://facebook.com/barbara.curated',
        'https://maps.app.goo.gl/k5tJ8F2c6y1Q8f3M8'
      ) ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Add columns to products table
    log("Adding filter columns to products table...");
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS brand TEXT,
      ADD COLUMN IF NOT EXISTS condition TEXT,
      ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS size TEXT,
      ADD COLUMN IF NOT EXISTS color TEXT
    `);

    log("Creating database indexes on products...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_size ON products(size);
      CREATE INDEX IF NOT EXISTS idx_products_color ON products(color);
    `);

    // 3. Upsert requested categories
    log("Upserting shop categories...");
    const categoriesToUpsert = [
      { name: "Kaos", slug: "kaos" },
      { name: "Hoodie", slug: "hoodie" },
      { name: "Jaket", slug: "jaket" },
      { name: "Celana", slug: "celana" },
      { name: "Sepatu", slug: "sepatu" },
      { name: "Aksesori", slug: "aksesori" }
    ];

    const dbCatsRes = await client.query("SELECT id, slug FROM categories");
    const dbCats = dbCatsRes.rows;

    const mapping: Record<string, string> = {
      "tops": "kaos",
      "outerwear": "jaket",
      "bottoms": "celana",
      "footwear": "sepatu",
      "accessories": "aksesori"
    };

    log("Deleting unused categories to avoid conflicts...");
    await client.query(`
      DELETE FROM categories 
      WHERE id NOT IN (SELECT DISTINCT category_id FROM products)
        AND slug NOT IN ('kaos', 'hoodie', 'jaket', 'celana', 'sepatu', 'aksesori')
    `);

    for (const cat of dbCats) {
      const newSlug = mapping[cat.slug];
      if (newSlug) {
        const item = categoriesToUpsert.find(c => c.slug === newSlug);
        if (item) {
          log(`Renaming category slug "${cat.slug}" to "${newSlug}" ("${item.name}")...`);
          await client.query(
            "UPDATE categories SET name = $1, slug = $2 WHERE id = $3",
            [item.name, newSlug, cat.id]
          );
        }
      }
    }

    for (const cat of categoriesToUpsert) {
      await client.query(`
        INSERT INTO categories (id, name, slug)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      `, ["cat_" + cat.slug, cat.name, cat.slug]);
    }

    // Get categories mapping after inserts
    const categoriesRes = await client.query("SELECT id, slug FROM categories");
    const categoryIdToSlug: Record<string, string> = {};
    categoriesRes.rows.forEach((row: any) => {
      categoryIdToSlug[row.id] = row.slug;
    });

    // 4. Populate product fields
    log("Populating filter fields on existing products...");
    const productsRes = await client.query("SELECT id, name, category_id FROM products");
    const products = productsRes.rows;

    const conditions = ["Baru", "Sangat Baik", "Baik", "Cukup"];
    const colorMap: Record<string, string> = {
      "black": "Hitam",
      "white": "Putih",
      "grey": "Abu-abu",
      "gray": "Abu-abu",
      "blue": "Biru",
      "red": "Merah",
      "green": "Hijau"
    };

    for (const prod of products) {
      const variantsRes = await client.query(
        "SELECT size, color FROM product_variants WHERE product_id = $1",
        [prod.id]
      );
      
      const sizesSet = new Set<string>();
      const colorsSet = new Set<string>();

      variantsRes.rows.forEach((v: any) => {
        if (v.size) sizesSet.add(v.size.toUpperCase().trim());
        if (v.color) {
          const colorEng = v.color.toLowerCase().trim();
          const colorInd = colorMap[colorEng] || "Lainnya";
          colorsSet.add(colorInd);
        }
      });

      const sizesStr = sizesSet.size > 0 ? `,${Array.from(sizesSet).join(",")},` : "";
      const colorsStr = colorsSet.size > 0 ? `,${Array.from(colorsSet).join(",")},` : "";

      let prodBrand = "Vintage";
      let prodCondition = "Sangat Baik";
      
      const lowerName = prod.name.toLowerCase();
      if (lowerName.includes("nike")) {
        prodBrand = "Nike";
      } else if (lowerName.includes("adidas")) {
        prodBrand = "Adidas";
      } else if (lowerName.includes("puma")) {
        prodBrand = "Puma";
      } else if (lowerName.includes("new balance")) {
        prodBrand = "New Balance";
      } else if (lowerName.includes("barbara")) {
        prodBrand = "Vintage";
      }

      const idxCond = Math.floor(Math.abs(prod.id.charCodeAt(0) + prod.id.charCodeAt(1)) % conditions.length);
      prodCondition = conditions[idxCond];
      
      const likesCount = Math.floor(Math.abs(prod.id.charCodeAt(0) * 7) % 40) + 5;
      const categorySlug = categoryIdToSlug[prod.category_id] || "kaos";

      log(`Product: "${prod.name}" -> Brand: ${prodBrand}, Condition: ${prodCondition}, Sizes: [${sizesStr}], Colors: [${colorsStr}]`);

      await client.query(`
        UPDATE products 
        SET brand = $1,
            condition = $2,
            likes_count = $3,
            category = $4,
            size = $5,
            color = $6
        WHERE id = $7
      `, [prodBrand, prodCondition, likesCount, categorySlug, sizesStr, colorsStr, prod.id]);
    }

    await client.query("COMMIT");
    log("Unified remote database migration completed successfully!");
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    if (client) {
      await client.query("ROLLBACK");
    }
    log(`Migration failed: ${err.message || err}`);
    return NextResponse.json({ success: false, error: err.message, logs }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}
