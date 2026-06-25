const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL.replace(':6543', ':5432').replace('?pgbouncer=true', '');
  console.log("Connecting to direct database URL:", connectionString.replace(/:[^:@]+@/, ':***@'));
  
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    console.log("Adding USER variant to Role enum...");
    try {
      await client.query(`ALTER TYPE "Role" ADD VALUE 'USER'`);
      console.log("Added 'USER' to Role enum.");
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log("'USER' variant already exists in Role enum.");
      } else {
        throw err;
      }
    }

    console.log("Updating users with role CUSTOMER to USER...");
    const res = await client.query(`UPDATE users SET role = 'USER' WHERE role = 'CUSTOMER'`);
    console.log(`Updated ${res.rowCount} users.`);
    
    console.log("SQL schema operations completed.");
  } catch (err) {
    console.error("Error during SQL execution:", err);
  } finally {
    await client.end();
  }
}

main();
