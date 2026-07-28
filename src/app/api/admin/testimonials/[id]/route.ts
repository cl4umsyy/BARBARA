import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 0;

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/testimonials/[id] - Disabled for content editing
export async function PUT() {
  return NextResponse.json(
    { error: "Isi ulasan pelanggan, nama, rating, dan produk tidak dapat diubah oleh admin." },
    { status: 405 }
  );
}

// PATCH /api/admin/testimonials/[id] - Toggle isShown (active status) for customer review
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Ulasan pelanggan tidak ditemukan" }, { status: 404 });
    }

    const newIsActive = typeof body.isActive === "boolean" ? body.isActive : !existing.isShown;

    // Update in remote Supabase database
    await supabaseAdmin
      .from("reviews")
      .update({ is_shown: newIsActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    // Update in local Prisma database
    const updated = await prisma.review.update({
      where: { id },
      data: { isShown: newIsActive },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true } }
      }
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.user?.name || "Pelanggan",
      rating: updated.rating,
      review: updated.review,
      productName: updated.product?.name || "-",
      isActive: updated.isShown,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[API Admin Testimonials PATCH Error]:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status testimoni", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/testimonials/[id] - Optional delete handler
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Ulasan tidak ditemukan" }, { status: 404 });
    }

    await supabaseAdmin.from("reviews").delete().eq("id", id);
    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ message: "Ulasan berhasil dihapus" });
  } catch (error: any) {
    console.error("[API Admin Testimonials DELETE Error]:", error);
    return NextResponse.json(
      { error: "Gagal menghapus ulasan", details: error.message },
      { status: 500 }
    );
  }
}

