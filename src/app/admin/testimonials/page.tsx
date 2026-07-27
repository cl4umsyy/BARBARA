import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { TestimonialsClient } from "@/components/admin/TestimonialsClient";
import { ShopErrorFallback } from "@/components/shop/ShopErrorFallback";

export const revalidate = 0; // Always fetch fresh testimonials

const INITIAL_TESTIMONIALS = [
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
];

export default async function AdminTestimonialsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/testimonials");
  }

  let testimonials: any[] = [];
  let dbError: any = null;

  try {
    const count = await prisma.testimonial.count();
    
    // Auto-seed default testimonials if table is empty
    if (count === 0) {
      await prisma.testimonial.createMany({
        data: INITIAL_TESTIMONIALS,
      });
    }

    testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (err: any) {
    console.error("[AdminTestimonialsPage Server] Database connection error:", err);
    dbError = err;
  }

  if (dbError) {
    return (
      <div className="px-4 py-16 md:px-8 lg:px-16 font-sans">
        <ShopErrorFallback
          error={dbError.message || String(dbError)}
          code="ADMIN_TESTIMONIALS_DB_ERROR"
          title="Dashboard Testimoni Terganggu"
          message="Gagal memuat daftar testimoni dari database karena kesalahan koneksi berikut:"
        />
      </div>
    );
  }

  const formattedTestimonials = testimonials.map((t) => ({
    id: t.id,
    name: t.name,
    rating: t.rating,
    review: t.review,
    productName: t.productName,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light font-sans bg-brand-white border border-brand-light">
          Memuat Halaman Testimoni...
        </div>
      }
    >
      <TestimonialsClient initialTestimonials={formattedTestimonials} />
    </React.Suspense>
  );
}
