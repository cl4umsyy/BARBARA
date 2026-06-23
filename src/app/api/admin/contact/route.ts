import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      storeName,
      description,
      address,
      whatsapp,
      email,
      businessHours,
      instagramUrl,
      tiktokUrl,
      facebookUrl,
      googleMapsUrl,
    } = body;

    // Minimum required validation
    if (!storeName || !description || !address || !whatsapp || !email || !businessHours) {
      return NextResponse.json(
        { error: "Nama toko, deskripsi, alamat, WhatsApp, email, dan jam operasional wajib diisi." },
        { status: 400 }
      );
    }

    let contactInfo = null;
    try {
      contactInfo = await prisma.contactInformation.findFirst();
    } catch (dbError: any) {
      console.error("[PUT /api/admin/contact] Database read error:", dbError.message || dbError);
      if (dbError.stack) {
        console.error(dbError.stack);
      }
      return NextResponse.json(
        { 
          error: "Gagal mengakses informasi kontak dari database. Pastikan tabel 'contact_information' sudah dibuat (menjalankan migrasi database).", 
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    try {
      if (contactInfo) {
        contactInfo = await prisma.contactInformation.update({
          where: { id: contactInfo.id },
          data: {
            storeName,
            description,
            address,
            whatsapp,
            email,
            businessHours,
            instagramUrl,
            tiktokUrl,
            facebookUrl,
            googleMapsUrl,
          },
        });
      } else {
        contactInfo = await prisma.contactInformation.create({
          data: {
            id: "contact_info_default",
            storeName,
            description,
            address,
            whatsapp,
            email,
            businessHours,
            instagramUrl,
            tiktokUrl,
            facebookUrl,
            googleMapsUrl,
          },
        });
      }
    } catch (dbWriteError: any) {
      console.error("[PUT /api/admin/contact] Database write error:", dbWriteError.message || dbWriteError);
      if (dbWriteError.stack) {
        console.error(dbWriteError.stack);
      }
      return NextResponse.json(
        { 
          error: "Gagal menyimpan pembaruan kontak ke database. Kemungkinan tabel 'contact_information' belum dimigrasi.", 
          details: dbWriteError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Informasi kontak berhasil diperbarui.",
      data: contactInfo,
    });
  } catch (error: any) {
    console.error("PUT /api/admin/contact general error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
