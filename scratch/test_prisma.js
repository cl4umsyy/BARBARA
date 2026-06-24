const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../src/generated/prisma/client');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.gyargxxfsuzhepumcynf:Fl3as0bas3d!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function run() {
  console.log("Connecting using Prisma...");
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const products = await prisma.product.findMany({ take: 1 });
    console.log("Prisma query success! Products found:", products.length);
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await pool.end();
  }
}

run();
