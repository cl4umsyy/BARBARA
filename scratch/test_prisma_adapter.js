const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

try {
  console.log("Attempting to instantiate PrismaPg adapter with undefined connectionString...");
  const pool = new Pool({ connectionString: undefined });
  const adapter = new PrismaPg(pool);
  console.log("Success! PrismaPg instantiated without error.");
} catch (err) {
  console.error("Error during PrismaPg instantiation:", err);
}
