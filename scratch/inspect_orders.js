const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const ordersRes = await client.query('SELECT id, order_number, status, payment_status, total FROM orders');
    console.log('Orders in DB:', ordersRes.rows);

    const itemsRes = await client.query('SELECT id, order_id, product_name, variant_id FROM order_items');
    console.log('Order Items in DB:', itemsRes.rows);

    const reviewsRes = await client.query('SELECT * FROM reviews');
    console.log('Reviews in DB:', reviewsRes.rows);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
