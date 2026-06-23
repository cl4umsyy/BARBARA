import prisma from "../src/lib/prisma";

console.log("Prisma keys:", Object.keys(prisma).filter(k => !k.startsWith("_")));
console.log("prisma.review is:", (prisma as any).review);
console.log("prisma.review keys:", (prisma as any).review ? Object.keys((prisma as any).review) : "undefined");
process.exit(0);
