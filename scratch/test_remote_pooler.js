const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres.gyargxxfsuzhepumcynf:freaky56789@db.gyargxxfsuzhepumcynf.supabase.co:6543/postgres?pgbouncer=true',
  connectionTimeoutMillis: 10000,
});

async function main() {
  console.log('Connecting to remote Supabase pooler...');
  const client = await pool.connect();
  console.log('Connected successfully!');
  try {
    const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
    console.log('Tables:', res.rows.map(r => r.tablename));
  } finally {
    client.release();
  }
  await pool.end();
}

main().catch(err => {
  console.error('Remote DB connection error:', err);
  process.exit(1);
});
