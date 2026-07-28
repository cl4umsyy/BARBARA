import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 0;

// GET /api/admin/testimonials
// Fetches customer reviews from completed/delivered orders to be managed as testimonials
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL"; // ALL, ACTIVE, INACTIVE
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const where: any = {
      order: {
        status: { in: ["COMPLETED", "DELIVERED"] }
      }
    };

    if (search.trim()) {
      where.OR = [
        { user: { name: { contains: search.trim(), mode: "insensitive" } } },
        { review: { contains: search.trim(), mode: "insensitive" } },
        { product: { name: { contains: search.trim(), mode: "insensitive" } } },
      ];
    }

    if (status === "ACTIVE") {
      where.isShown = true;
    } else if (status === "INACTIVE") {
      where.isShown = false;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true }
          },
          product: {
            select: { name: true }
          },
          order: {
            select: { orderNumber: true, status: true }
          }
        }
      }),
      prisma.review.count({ where }),
    ]);

    const testimonials = reviews.map((r) => ({
      id: r.id,
      name: r.user?.name || "Pelanggan",
      rating: r.rating,
      review: r.review,
      productName: r.product?.name || "-",
      isActive: r.isShown,
      orderNumber: r.order?.orderNumber || "-",
      orderStatus: r.order?.status || "COMPLETED",
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      testimonials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("[API Admin Testimonials GET Error]:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ulasan pelanggan", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/testimonials - Disabled for manual creation
export async function POST() {
  return NextResponse.json(
    { error: "Fitur tambah testimoni manual telah dinonaktifkan. Seluruh testimoni diambil otomatis dari ulasan asli pembeli." },
    { status: 405 }
  );
}

