require("dotenv").config();
const prisma = require("../src/lib/prisma").default;

async function main() {
  console.log("Checking Testimonial database table...");

  const initialCount = await prisma.testimonial.count();
  console.log("Initial Testimonials count:", initialCount);

  if (initialCount === 0) {
    console.log("Seeding default testimonials...");
    await prisma.testimonial.createMany({
      data: [
        {
          name: "Rian H.",
          review: "Kualitas kaosnya tebal banget, bener-bener heavyweight 24s. Pas dipake fitting-nya oversized premium.",
          rating: 5,
          productName: "Oversized Noir Tee",
          isActive: true,
        },
        {
          name: "Siti M.",
          review: "Checkout cepet banget pake VA Midtrans. Admin panel tracking resi langsung masuk email. Trusted!",
          rating: 5,
          productName: "Heavy Cargo Pants",
          isActive: true,
        },
        {
          name: "Dika A.",
          review: "Bahannya adem walaupun tebal. Monochrome cutting-nya keren buat streetwear style sehari-hari.",
          rating: 5,
          productName: "Cyberpunk Hood",
          isActive: true,
        },
      ],
    });
  }

  const allTestimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log("Database Testimonials:");
  console.table(allTestimonials.map(t => ({
    id: t.id,
    name: t.name,
    rating: t.rating,
    productName: t.productName,
    isActive: t.isActive,
    review: t.review.substring(0, 30) + "..."
  })));

  const activeOnly = await prisma.testimonial.findMany({
    where: { isActive: true }
  });
  console.log("Active Testimonials Count:", activeOnly.length);

  console.log("Verification SUCCESS!");
}

main()
  .catch((e) => {
    console.error("Error testing Testimonial model:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
