const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({
    where: {
      order: {
        status: { in: ['COMPLETED', 'DELIVERED'] }
      }
    },
    include: {
      user: true,
      product: true,
      order: true,
    }
  });

  console.log("Prisma reviews count for COMPLETED/DELIVERED:", reviews.length);
  console.log(JSON.stringify(reviews, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
