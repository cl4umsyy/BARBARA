const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
    `);
    console.log('Columns in products table:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable}, Default: ${row.column_default})`);
    });
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
