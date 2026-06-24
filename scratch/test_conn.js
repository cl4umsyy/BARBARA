const { Client } = require('pg');
const connectionString = "postgresql://postgres.gyargxxfsuzhepumcynf:Fl3as0bas3d!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";

async function run() {
  console.log("Connecting...");
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query("SELECT NOW()");
    console.log("Result:", res.rows[0]);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.end();
  }
}

run();
