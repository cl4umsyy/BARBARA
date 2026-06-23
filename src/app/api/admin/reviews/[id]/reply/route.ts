import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function POST(
  req: NextRequest,
  props: { params: Params }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();
    const { reply } = body;

    if (reply === undefined || reply === null) {
      return NextResponse.json(
        { error: "Isi balasan ulasan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const trimmedReply = reply.trim();

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        adminReply: trimmedReply || null,
        adminRepliedAt: trimmedReply ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: trimmedReply
        ? "Balasan ulasan resmi admin berhasil dikirim"
        : "Balasan ulasan resmi admin berhasil dihapus",
      review: updatedReview,
    });
  } catch (error: any) {
    console.error("[Admin Review Reply POST API] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Gagal memproses balasan ulasan resmi admin" },
      { status: 500 }
    );
  }
}
