import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
