const { Pool } = require('pg');

const passwords = [
  'freaky56789',
  'mgO4BCqaGJvbKhzN',
  'Admin123!',
  'Customer123!',
  'postgres',
  'barbara',
  'barbara_ecommerce'
];

async function tryPassword(password) {
  const connectionString = `postgres://postgres:${password}@db.gyargxxfsuzhepumcynf.supabase.co:6543/postgres?pgbouncer=true`;
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log(`SUCCESS! Password is: ${password}`);
    client.release();
    await pool.end();
    return true;
  } catch (err) {
    console.log(`Failed for password: ${password} - ${err.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  for (const pw of passwords) {
    const success = await tryPassword(pw);
    if (success) {
      process.exit(0);
    }
  }
  console.log('All passwords failed.');
  process.exit(1);
}

main();
