const { Client } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database. Running migration...");
    
    // Add address_id column to orders table if not exists
    await client.query('ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "address_id" TEXT;');
    console.log("SQL Migration successful: address_id column added to orders table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
