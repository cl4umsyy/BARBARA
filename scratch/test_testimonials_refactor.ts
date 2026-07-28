import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("=== 1. Testing Admin Testimonials Query ===");
  const adminReviews = await prisma.review.findMany({
    where: {
      order: {
        status: { in: ["COMPLETED", "DELIVERED"] }
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true } },
      order: { select: { orderNumber: true, status: true } }
    }
  });

  console.log(`Found ${adminReviews.length} customer reviews for COMPLETED/DELIVERED orders.`);
  adminReviews.forEach((r, idx) => {
    console.log(`[${idx + 1}] ID: ${r.id}`);
    console.log(`    Customer: ${r.user?.name} (${r.user?.email})`);
    console.log(`    Product: ${r.product?.name}`);
    console.log(`    Order: ${r.order?.orderNumber} [${r.order?.status}]`);
    console.log(`    Rating: ${r.rating} | Text: "${r.review}"`);
    console.log(`    isShown (isActive on Home): ${r.isShown}`);
  });

  console.log("\n=== 2. Testing Home Page Active Testimonials Query (Max 3) ===");
  const homeReviews = await prisma.review.findMany({
    where: {
      isShown: true,
      order: {
        status: { in: ["COMPLETED", "DELIVERED"] }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true } }
    }
  });

  console.log(`Found ${homeReviews.length} active testimonials for Home page (max 3):`);
  homeReviews.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.user?.name} - ${r.product?.name} (${r.rating} stars): "${r.review}"`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
