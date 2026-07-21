const { Client } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database. Running migration for ProductGender enum and column...");

    // Create Type if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductGender') THEN
          CREATE TYPE "ProductGender" AS ENUM (
            'MEN',
            'WOMEN'
          );
        END IF;
      END$$;
    `);
    console.log("✓ ProductGender Enum type checked/created");

    // Add column if not exists
    await client.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gender" "ProductGender";');
    console.log("✓ gender column checked/added to products table");

    console.log("SQL Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
