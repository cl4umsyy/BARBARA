import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin, isMissingColumnError } from "@/lib/supabase";
import { cloudinary, extractPublicId, deleteFromCloudinary } from "@/lib/cloudinary";
import path from "path";

export async function POST(req: Request) {
  try {
    // 1. Authenticate session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // 3. Validate file size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal adalah 5 MB" },
        { status: 400 }
      );
    }

    // 4. Validate file type (only JPG, JPEG, PNG, WEBP)
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const fileExtension = path.extname(file.name).toLowerCase();

    if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Hanya JPG, JPEG, PNG, dan WEBP yang diizinkan." },
        { status: 400 }
      );
    }

    // 5. Query the user's current avatar URL to delete it from Cloudinary
    let selectResult = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (selectResult.error && isMissingColumnError(selectResult.error)) {
      selectResult = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
    }

    const oldAvatarUrl = selectResult.data?.avatar_url || null;

    // 6. Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64 Data URI for upload
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const fileUri = `data:${mimeType};base64,${base64Data}`;

    // 7. Upload new image to Cloudinary under 'avatars' folder
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        fileUri,
        {
          folder: "avatars",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    const newAvatarUrl = uploadResult.secure_url;

    // 8. Update database
    let updateResult = await supabaseAdmin
      .from("users")
      .update({ avatar_url: newAvatarUrl })
      .eq("id", userId)
      .select("avatar_url")
      .single();

    if (updateResult.error && isMissingColumnError(updateResult.error)) {
      // Fallback for remote DB without avatar_url column
      updateResult = { data: { avatar_url: newAvatarUrl }, error: null } as any;
    }

    if (updateResult.error) {
      throw updateResult.error;
    }

    // 9. If database update is successful, delete old avatar from Cloudinary
    if (oldAvatarUrl) {
      const publicId = extractPublicId(oldAvatarUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch((err) => {
          console.error("Failed to delete old avatar from Cloudinary:", err);
        });
      }
    }

    return NextResponse.json({
      url: newAvatarUrl,
      message: "Foto profil berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("[Profile Avatar POST API] Error:", error?.message || error);
    return NextResponse.json(
      { error: `Gagal memperbarui foto profil: ${error?.message || JSON.stringify(error)}` },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // 1. Authenticate session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Query the current avatar URL
    let selectResult = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (selectResult.error && isMissingColumnError(selectResult.error)) {
      selectResult = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
    }

    const oldAvatarUrl = selectResult.data?.avatar_url || null;

    if (!oldAvatarUrl) {
      return NextResponse.json({ message: "Foto profil memang kosong" });
    }

    // 3. Update database to null
    let updateResult = await supabaseAdmin
      .from("users")
      .update({ avatar_url: null })
      .eq("id", userId)
      .select("avatar_url")
      .single();

    if (updateResult.error && isMissingColumnError(updateResult.error)) {
      updateResult = { data: { avatar_url: null }, error: null } as any;
    }

    if (updateResult.error) {
      throw updateResult.error;
    }

    // 4. Delete old avatar from Cloudinary
    const publicId = extractPublicId(oldAvatarUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId).catch((err) => {
        console.error("Failed to delete avatar from Cloudinary:", err);
      });
    }

    return NextResponse.json({
      message: "Foto profil berhasil dihapus",
    });
  } catch (error: any) {
    console.error("[Profile Avatar DELETE API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal menghapus foto profil" },
      { status: 500 }
    );
  }
}
