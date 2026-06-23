const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env.local' });
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, email, name, password FROM users");
    console.log(res.rows);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
