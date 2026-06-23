const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("--- Contact Information ---");
    const info = await client.query('SELECT * FROM contact_information');
    console.log(info.rows);

    console.log("\n--- Contact Messages ---");
    const messages = await client.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    console.log(messages.rows);

    console.log("\n--- Admin Users ---");
    const admins = await client.query("SELECT id, name, email, role FROM users WHERE role = 'ADMIN'");
    console.log(admins.rows);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
