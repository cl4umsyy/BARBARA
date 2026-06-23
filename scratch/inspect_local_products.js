const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Connecting to local database...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, slug, is_active FROM products');
    console.log('Products in local database:');
    res.rows.forEach(p => {
      console.log(`- ID: ${p.id}, Slug: ${p.slug}, Name: ${p.name}, Active: ${p.is_active}`);
    });
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
