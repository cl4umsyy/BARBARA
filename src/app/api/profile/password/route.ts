import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { z } from "zod";

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password baru minimal 8 karakter")
    .regex(/[A-Z]/, "Password baru harus mengandung minimal 1 huruf kapital")
    .regex(/[0-9]/, "Password baru harus mengandung minimal 1 angka"),
  confirmPassword: z.string().min(1, "Konfirmasi password baru wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password baru tidak cocok",
  path: ["confirmPassword"],
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = PasswordChangeSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || "Input tidak valid";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // Fetch the user's password hash from DB
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("password")
      .eq("id", session.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Verify current password matches
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Save to database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password: hashedNewPassword })
      .eq("id", session.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: "Password berhasil diperbarui" });
  } catch (error: any) {
    console.error("[Profile Password PUT API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal memperbarui password" },
      { status: 500 }
    );
  }
}
