const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/BARBARA E-commerce/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const userId = '26068fb1-8c35-4d6c-be75-8836c05a04c9'; // tester1@example.com
  const orderId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
  const productId = '33c0b0ed-fbd8-4393-b1fa-8b2282ad3063'; // baju ambarawa

  const client = await pool.connect();
  try {
    const userRes = await client.query('SELECT id, email, name FROM users WHERE id = $1', [userId]);
    console.log('Local User:', userRes.rows);

    const orderRes = await client.query('SELECT id, order_number FROM orders WHERE id = $1', [orderId]);
    console.log('Local Order:', orderRes.rows);

    const productRes = await client.query('SELECT id, name FROM products WHERE id = $1', [productId]);
    console.log('Local Product:', productRes.rows);
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(console.error);
