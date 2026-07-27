import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 0;

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/testimonials/[id] - Update testimonial
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, rating, review, productName, isActive } = body;

    // Check if testimonial exists
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

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

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        name: name.trim(),
        rating: Math.round(numericRating),
        review: review.trim(),
        productName: productName.trim(),
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API Admin Testimonials PUT Error]:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui testimoni", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/testimonials/[id] - Toggle isActive status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

    const newIsActive = typeof body.isActive === "boolean" ? body.isActive : !existing.isActive;

    const updated = await prisma.testimonial.update({
      where: { id },
      data: { isActive: newIsActive },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[API Admin Testimonials PATCH Error]:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status testimoni", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/testimonials/[id] - Delete testimonial
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Testimoni tidak ditemukan" }, { status: 404 });
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ message: "Testimoni berhasil dihapus" });
  } catch (error: any) {
    console.error("[API Admin Testimonials DELETE Error]:", error);
    return NextResponse.json(
      { error: "Gagal menghapus testimoni", details: error.message },
      { status: 500 }
    );
  }
}
