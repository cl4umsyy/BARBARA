const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const productsRes = await client.query('SELECT id, name, category_id, price FROM products LIMIT 5');
    console.log('Products:', productsRes.rows);

    const categoriesRes = await client.query('SELECT id, name, slug FROM categories');
    console.log('Categories:', categoriesRes.rows);

    const variantsRes = await client.query('SELECT id, product_id, size, color, stock FROM product_variants LIMIT 5');
    console.log('Variants:', variantsRes.rows);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
