require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Creating testimonials table in database if not exists...");
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      review TEXT NOT NULL,
      product_name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(createTableQuery);
  console.log("Table 'testimonials' created successfully!");

  const countRes = await pool.query("SELECT COUNT(*) FROM testimonials");
  console.log("Current row count in testimonials table:", countRes.rows[0].count);
}

main()
  .catch((err) => {
    console.error("Error creating testimonials table:", err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
