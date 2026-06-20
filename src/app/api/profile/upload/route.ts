import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import path from "path";

export async function POST(req: Request) {
  try {
    // 1. Verify user authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate file size (max 2 MB for profile avatars)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal adalah 2 MB" },
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

    // 5. Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Convert buffer to base64 Data URI for upload
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const fileUri = `data:${mimeType};base64,${base64Data}`;

    // 7. Upload to Cloudinary under 'avatars' folder
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

    // 8. Return the secure URL from Cloudinary
    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error: any) {
    console.error("Cloudinary profile upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
