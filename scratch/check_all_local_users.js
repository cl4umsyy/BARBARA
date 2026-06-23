const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const usersRes = await client.query('SELECT id, email, name FROM users');
    console.log('All Local Users:', usersRes.rows);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
