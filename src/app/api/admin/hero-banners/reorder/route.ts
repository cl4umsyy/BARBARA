import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const revalidate = 0;

// POST /api/admin/hero-banners/reorder - Reorder banners list
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body; // Array of { id: string, order: number }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Format payload tidak valid" }, { status: 400 });
    }

    // Perform transaction to update orders
    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.heroBanner.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    const updatedBanners = await prisma.heroBanner.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      message: "Urutan banner berhasil diperbarui",
      banners: updatedBanners,
    });
  } catch (error: any) {
    console.error("[API Admin Hero Banners Reorder Error]:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui urutan banner", details: error.message },
      { status: 500 }
    );
  }
}
