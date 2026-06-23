const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('Connecting to local database using DATABASE_URL...');
  const client = await pool.connect();
  console.log('Connected successfully!');
  try {
    const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
    console.log('Tables:', res.rows.map(r => r.tablename));
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(err => {
  console.error('Local DB connection error:', err);
  process.exit(1);
});
