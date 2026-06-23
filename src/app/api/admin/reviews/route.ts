import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Fetch all reviews for admin panel
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
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
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    // Map to flatter structure for easier client consumption
    const formattedReviews = reviews.map((r) => {
      const productImage = r.product.images[0]?.url || "";
      return {
        id: r.id,
        rating: r.rating,
        review: r.review,
        reviewImages: r.reviewImages,
        isShown: r.isShown,
        adminReply: r.adminReply,
        adminRepliedAt: r.adminRepliedAt,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
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

    return NextResponse.json(formattedReviews);
  } catch (error: any) {
    console.error("[Admin Reviews GET API] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Gagal mengambil ulasan pelanggan" },
      { status: 500 }
    );
  }
}

// PATCH: Toggle isShown status of a review
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reviewId, isShown } = body;

    if (!reviewId || typeof isShown !== "boolean") {
      return NextResponse.json(
        { error: "Data reviewId dan isShown wajib diisi dengan benar" },
        { status: 400 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isShown },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
    });

    return NextResponse.json({
      message: `Status ulasan berhasil diubah menjadi ${isShown ? "Aktif" : "Disembunyikan"}`,
      review: updatedReview,
    });
  } catch (error: any) {
    console.error("[Admin Reviews PATCH API] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Gagal mengubah status visibilitas ulasan" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a review from database
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID wajib diisi" },
        { status: 400 }
      );
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ message: "Ulasan berhasil dihapus secara permanen" });
  } catch (error: any) {
    console.error("[Admin Reviews DELETE API] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Gagal menghapus ulasan pelanggan" },
      { status: 500 }
    );
  }
}
