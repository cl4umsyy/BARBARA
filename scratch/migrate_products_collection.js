const { Client } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL database. Running migration for Collection enum and column...");

    // Create Type if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Collection') THEN
          CREATE TYPE "Collection" AS ENUM (
            'NEW_ARRIVALS',
            'BEST_SELLERS',
            'GRAPHIC_TEES',
            'OVERSIZED_COLLECTION',
            'ESSENTIALS',
            'LIMITED_EDITION'
          );
        END IF;
      END$$;
    `);
    console.log("✓ Collection Enum type checked/created");

    // Add column if not exists
    await client.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "collection" "Collection";');
    console.log("✓ collection column checked/added to products table");

    console.log("SQL Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
