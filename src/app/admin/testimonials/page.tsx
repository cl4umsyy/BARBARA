import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { TestimonialsClient } from "@/components/admin/TestimonialsClient";
import { ShopErrorFallback } from "@/components/shop/ShopErrorFallback";

export const revalidate = 0; // Always fetch fresh testimonials

export default async function AdminTestimonialsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/testimonials");
  }

  let reviews: any[] = [];
  let dbError: any = null;

  try {
    reviews = await prisma.review.findMany({
      where: {
        order: {
          status: { in: ["COMPLETED", "DELIVERED"] }
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        product: {
          select: {
            name: true,
          }
        },
        order: {
          select: {
            orderNumber: true,
            status: true,
          }
        }
      }
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
          message="Gagal memuat ulasan pelanggan dari database karena kesalahan koneksi berikut:"
        />
      </div>
    );
  }

  const formattedTestimonials = reviews.map((r) => ({
    id: r.id,
    name: r.user?.name || "Pelanggan",
    rating: r.rating,
    review: r.review,
    productName: r.product?.name || "-",
    isActive: r.isShown,
    orderNumber: r.order?.orderNumber || "-",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light font-sans bg-brand-white border border-brand-light">
          Memuat Kelola Testimoni Komunitas...
        </div>
      }
    >
      <TestimonialsClient initialTestimonials={formattedTestimonials} />
    </React.Suspense>
  );
}

