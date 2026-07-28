import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 0;

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/hero-banners/[id] - Update banner
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      description,
      imageUrl,
      buttonText,
      buttonLink,
      categorySlug,
      order,
      isActive,
    } = body;

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    // Validation
    const errors: Record<string, string> = {};
    if (!title || typeof title !== "string" || !title.trim()) {
      errors.title = "Judul banner wajib diisi.";
    }
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      errors.imageUrl = "Gambar banner wajib diunggah.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validasi gagal", errors }, { status: 400 });
    }

    const updatedBanner = await prisma.heroBanner.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl.trim(),
        buttonText: buttonText?.trim() || "Belanja Sekarang",
        buttonLink: buttonLink?.trim() || (categorySlug ? `/shop?category=${categorySlug}` : "/shop"),
        categorySlug: categorySlug?.trim() || null,
        order: typeof order === "number" ? order : existing.order,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      },
    });

    return NextResponse.json(updatedBanner);
  } catch (error: any) {
    console.error("[API Admin Hero Banners PUT Error]:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui banner", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/hero-banners/[id] - Toggle isActive or single field
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    const newIsActive = typeof body.isActive === "boolean" ? body.isActive : !existing.isActive;

    const updatedBanner = await prisma.heroBanner.update({
      where: { id },
      data: {
        isActive: newIsActive,
        ...(typeof body.order === "number" ? { order: body.order } : {}),
      },
    });

    return NextResponse.json(updatedBanner);
  } catch (error: any) {
    console.error("[API Admin Hero Banners PATCH Error]:", error);
    return NextResponse.json(
      { error: "Gagal mengubah status banner", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hero-banners/[id] - Delete banner
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    await prisma.heroBanner.delete({ where: { id } });

    return NextResponse.json({ message: "Banner berhasil dihapus" });
  } catch (error: any) {
    console.error("[API Admin Hero Banners DELETE Error]:", error);
    return NextResponse.json(
      { error: "Gagal menghapus banner", details: error.message },
      { status: 500 }
    );
  }
}
