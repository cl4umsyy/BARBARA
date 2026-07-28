import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 0;

// GET /api/admin/hero-banners - Fetch all banners ordered by display order
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma.heroBanner) {
      return NextResponse.json([]);
    }

    const banners = await prisma.heroBanner.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("[API Admin Hero Banners GET Error]:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data banner", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/hero-banners - Create a new hero banner
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Determine default order if not provided
    let finalOrder = typeof order === "number" ? order : 0;
    if (typeof order !== "number") {
      const highestOrderBanner = await prisma.heroBanner.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      finalOrder = highestOrderBanner ? highestOrderBanner.order + 1 : 1;
    }

    const newBanner = await prisma.heroBanner.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl.trim(),
        buttonText: buttonText?.trim() || "Belanja Sekarang",
        buttonLink: buttonLink?.trim() || (categorySlug ? `/shop?category=${categorySlug}` : "/shop"),
        categorySlug: categorySlug?.trim() || null,
        order: finalOrder,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json(newBanner, { status: 201 });
  } catch (error: any) {
    console.error("[API Admin Hero Banners POST Error]:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan banner", details: error.message },
      { status: 500 }
    );
  }
}
