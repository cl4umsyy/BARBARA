import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL;
  let dbHost = "NOT_SET";
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      dbHost = parsed.host;
    } catch {
      dbHost = dbUrl.substring(0, 15) + "...";
    }
  }
  console.log(`[Prisma Runtime] Instantiating PrismaClient with host: ${dbHost}`);

  const pool = new Pool({
    connectionString: dbUrl,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const getPrismaClient = () => {
  if (process.env.NODE_ENV === "production") {
    return prismaClientSingleton();
  }
  
  if (!globalThis.prismaGlobal || !("review" in globalThis.prismaGlobal)) {
    console.log("[Prisma] Initializing or re-creating PrismaClient singleton with updated models...");
    globalThis.prismaGlobal = prismaClientSingleton();
  }
  return globalThis.prismaGlobal;
};

const prisma = getPrismaClient();

export default prisma;
