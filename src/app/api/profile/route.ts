import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin, isMissingColumnError } from "@/lib/supabase";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().nullable().optional().refine((val) => {
    if (!val) return true;
    return val.length >= 8 && val.length <= 15 && /^[0-9+]+$/.test(val);
  }, "Nomor telepon tidak valid"),
  avatarUrl: z.string().url("Avatar URL tidak valid").or(z.string().length(0)).nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userResult = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, avatar_url, created_at")
      .eq("id", session.user.id)
      .maybeSingle();

    let user = userResult.data;
    let error = userResult.error;

    if (error && isMissingColumnError(error)) {
      const fallbackResult = await supabaseAdmin
        .from("users")
        .select("id, name, email, created_at")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (fallbackResult.error) {
        error = fallbackResult.error;
      } else {
        user = fallbackResult.data ? {
          ...fallbackResult.data,
          phone: null,
          avatar_url: null,
        } : null;
        error = null;
      }
    }

    if (error || !user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    });
  } catch (error: any) {
    console.error("[Profile GET API] Error:", error?.message);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = ProfileUpdateSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || "Input tidak valid";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, phone, avatarUrl } = validation.data;

    let updateResult = await supabaseAdmin
      .from("users")
      .update({
        name,
        phone: phone || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", session.user.id)
      .select("id, name, email, phone, avatar_url, created_at")
      .single();

    let updatedUser = updateResult.data;
    let error = updateResult.error;

    if (error && isMissingColumnError(error)) {
      const fallbackResult = await supabaseAdmin
        .from("users")
        .update({ name })
        .eq("id", session.user.id)
        .select("id, name, email, created_at")
        .single();
      
      if (fallbackResult.error) {
        error = fallbackResult.error;
      } else {
        updatedUser = fallbackResult.data ? {
          ...fallbackResult.data,
          phone: null,
          avatar_url: null,
        } : null;
        error = null;
      }
    }

    if (error || !updatedUser) throw error || new Error("Gagal memperbarui");

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatar_url,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error: any) {
    console.error("[Profile PUT API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
