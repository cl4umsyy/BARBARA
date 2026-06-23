const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  console.log('Connected to database. Starting migration...');

  try {
    await client.query('BEGIN');

    // 1. Add columns to products table if they don't exist
    console.log('Adding columns to products table...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS brand TEXT,
      ADD COLUMN IF NOT EXISTS condition TEXT,
      ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS size TEXT,
      ADD COLUMN IF NOT EXISTS color TEXT
    `);

    // 2. Create B-tree indexes for the filter columns
    console.log('Creating database indexes on products...');
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
    console.log('Upserting shop categories...');
    const categoriesToUpsert = [
      { name: 'Kaos', slug: 'kaos' },
      { name: 'Hoodie', slug: 'hoodie' },
      { name: 'Jaket', slug: 'jaket' },
      { name: 'Celana', slug: 'celana' },
      { name: 'Sepatu', slug: 'sepatu' },
      { name: 'Aksesori', slug: 'aksesori' }
    ];

    // Find all categories in DB first
    const dbCatsRes = await client.query('SELECT id, slug FROM categories');
    const dbCats = dbCatsRes.rows;

    // Map old slugs to new slugs
    // Tops -> Kaos
    // Outerwear -> Jaket
    // Bottoms -> Celana
    const mapping = {
      'tops': 'kaos',
      'outerwear': 'jaket',
      'bottoms': 'celana',
      'footwear': 'sepatu',
      'accessories': 'aksesori'
    };

    // First delete any category that is NOT used by any product and has a slug we don't want or conflicting slug
    console.log('Deleting unused categories to avoid conflicts...');
    await client.query(`
      DELETE FROM categories 
      WHERE id NOT IN (SELECT DISTINCT category_id FROM products)
        AND slug NOT IN ('kaos', 'hoodie', 'jaket', 'celana', 'sepatu', 'aksesori')
    `);

    // Now update referenced categories to their new names/slugs
    for (const cat of dbCats) {
      const newSlug = mapping[cat.slug];
      if (newSlug) {
        const newName = categoriesToUpsert.find(c => c.slug === newSlug).name;
        console.log(`Renaming category slug "${cat.slug}" to "${newSlug}" ("${newName}")...`);
        await client.query(
          `UPDATE categories SET name = $1, slug = $2 WHERE id = $3`,
          [newName, newSlug, cat.id]
        );
      }
    }

    // Insert any missing categories from the target list
    for (const cat of categoriesToUpsert) {
      await client.query(`
        INSERT INTO categories (id, name, slug)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      `, ['cat_' + cat.slug, cat.name, cat.slug]);
    }

    // Get all categories to map id to slug
    const categoriesRes = await client.query('SELECT id, slug FROM categories');
    const categoryIdToSlug = {};
    categoriesRes.rows.forEach(row => {
      categoryIdToSlug[row.id] = row.slug;
    });

    // 4. Populate product fields
    console.log('Populating filter fields on existing products...');
    const productsRes = await client.query('SELECT id, name, category_id FROM products');
    const products = productsRes.rows;

    const brands = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Vintage', 'Lainnya'];
    const conditions = ['Baru', 'Sangat Baik', 'Baik', 'Cukup'];

    // Map color names from English to Indonesian
    const colorMap = {
      'black': 'Hitam',
      'white': 'Putih',
      'grey': 'Abu-abu',
      'gray': 'Abu-abu',
      'blue': 'Biru',
      'red': 'Merah',
      'green': 'Hijau'
    };

    for (const prod of products) {
      // Find variants of this product to aggregate size and color
      const variantsRes = await client.query(
        'SELECT size, color FROM product_variants WHERE product_id = $1',
        [prod.id]
      );
      
      const sizesSet = new Set();
      const colorsSet = new Set();

      variantsRes.rows.forEach(v => {
        if (v.size) sizesSet.add(v.size.toUpperCase().trim());
        if (v.color) {
          const colorEng = v.color.toLowerCase().trim();
          const colorInd = colorMap[colorEng] || 'Lainnya';
          colorsSet.add(colorInd);
        }
      });

      const sizesStr = sizesSet.size > 0 ? `,${Array.from(sizesSet).join(',')},` : '';
      const colorsStr = colorsSet.size > 0 ? `,${Array.from(colorsSet).join(',')},` : '';

      // Decide brand, condition, and likes
      let prodBrand = 'Vintage';
      let prodCondition = 'Sangat Baik';
      
      const lowerName = prod.name.toLowerCase();
      if (lowerName.includes('nike')) {
        prodBrand = 'Nike';
      } else if (lowerName.includes('adidas')) {
        prodBrand = 'Adidas';
      } else if (lowerName.includes('puma')) {
        prodBrand = 'Puma';
      } else if (lowerName.includes('new balance')) {
        prodBrand = 'New Balance';
      } else if (lowerName.includes('barbara')) {
        prodBrand = 'Vintage';
      }

      // Assign a random condition and likes if needed
      const idxCond = Math.floor(Math.abs(prod.id.charCodeAt(0) + prod.id.charCodeAt(1)) % conditions.length);
      prodCondition = conditions[idxCond];
      
      const likesCount = Math.floor(Math.abs(prod.id.charCodeAt(0) * 7) % 40) + 5; // deterministic likes between 5 and 45
      const categorySlug = categoryIdToSlug[prod.category_id] || 'kaos';

      console.log(`Product: "${prod.name}" -> Category: ${categorySlug}, Brand: ${prodBrand}, Condition: ${prodCondition}, Sizes: [${sizesStr}], Colors: [${colorsStr}]`);

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

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back.', err);
    process.exit(1);
  } finally {
    client.release();
  }
  await pool.end();
}

main();
