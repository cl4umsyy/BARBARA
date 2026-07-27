import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 0;

// GET /api/admin/testimonials
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

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { review: { contains: search.trim(), mode: "insensitive" } },
        { productName: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    const skip = (page - 1) * limit;

    const [testimonials, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.testimonial.count({ where }),
    ]);

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
      { error: "Gagal mengambil data testimoni", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/testimonials
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, rating, review, productName, isActive } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!name || typeof name !== "string" || !name.trim()) {
      errors.name = "Nama pelanggan wajib diisi.";
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      errors.rating = "Rating harus berupa angka antara 1 sampai 5.";
    }

    if (!review || typeof review !== "string" || !review.trim()) {
      errors.review = "Isi ulasan wajib diisi.";
    }

    if (!productName || typeof productName !== "string" || !productName.trim()) {
      errors.productName = "Nama produk yang dibeli wajib diisi.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validasi gagal", errors }, { status: 400 });
    }

    const newTestimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        rating: Math.round(numericRating),
        review: review.trim(),
        productName: productName.trim(),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error: any) {
    console.error("[API Admin Testimonials POST Error]:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan testimoni", details: error.message },
      { status: 500 }
    );
  }
}
