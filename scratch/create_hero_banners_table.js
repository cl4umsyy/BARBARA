require("dotenv").config({ path: "d:/BARBARA E-commerce/.env.local" });
require("dotenv").config({ path: "d:/BARBARA E-commerce/.env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Creating hero_banners table in database if not exists...");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS hero_banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      button_text TEXT NOT NULL DEFAULT 'Belanja Sekarang',
      button_link TEXT,
      category_slug TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_hero_banners_order ON hero_banners("order");
    CREATE INDEX IF NOT EXISTS idx_hero_banners_is_active ON hero_banners(is_active);
  `;

  await pool.query(createTableQuery);
  console.log("Table 'hero_banners' created successfully!");
}

main()
  .catch((err) => {
    console.error("Error creating hero_banners table:", err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
