import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ReviewsClient } from "@/components/admin/ReviewsClient";
import { ShopErrorFallback } from "@/components/shop/ShopErrorFallback";

export const revalidate = 0; // Always fetch fresh reviews

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login?callbackUrl=/admin/reviews");
  }

  // Fetch reviews directly from DB with crash-resilience
  let reviews: any[] = [];
  let dbError: any = null;

  try {
    reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              orderBy: { order: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });
  } catch (err: any) {
    console.error("[AdminReviewsPage Server] Database connection error:", err);
    dbError = err;
  }

  if (dbError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:px-16">
        <ShopErrorFallback 
          error={dbError.message || String(dbError)} 
          code="ADMIN_REVIEWS_DB_ERROR"
          title="Dashboard Ulasan Terganggu"
          message="Gagal memuat daftar ulasan dari database karena kesalahan koneksi berikut:"
        />
      </div>
    );
  }

  const formattedReviews = reviews.map((r) => {
    const productImage = r.product.images[0]?.url || "";
    return {
      id: r.id,
      rating: r.rating,
      review: r.review,
      reviewImages: r.reviewImages,
      isShown: r.isShown,
      adminReply: r.adminReply,
      adminRepliedAt: r.adminRepliedAt ? r.adminRepliedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      orderNumber: r.order.orderNumber,
      user: {
        name: r.user.name,
        email: r.user.email,
        avatarUrl: r.user.avatarUrl,
      },
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        image: productImage,
      },
    };
  });

  return (
    <React.Suspense fallback={
      <div className="py-20 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-light font-sans bg-brand-white border border-brand-light">
        Memuat Halaman Ulasan...
      </div>
    }>
      <ReviewsClient initialReviews={formattedReviews} />
    </React.Suspense>
  );
}
