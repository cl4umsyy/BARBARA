import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 0; // Disable dynamic caching to ensure fresh info

export async function GET() {
  try {
    let contactInfo = await prisma.contactInformation.findFirst();

    if (!contactInfo) {
      // Self-healing fallback if database seed has not run yet
      contactInfo = await prisma.contactInformation.create({
        data: {
          id: "contact_info_default",
          storeName: "BARBARA",
          description: "Premium fashion & thrift store. Handpicked quality products for your everyday curated style.",
          address: "Jl. Sunan Kudus No. 100, Kudus, Jawa Tengah 59313, Indonesia",
          whatsapp: "6281234567890",
          email: "contact@barbarastore.com",
          businessHours: "Senin - Minggu, 09.00 - 21.00 WIB",
          instagramUrl: "https://instagram.com/barbara.curated",
          tiktokUrl: "https://tiktok.com/@barbara.curated",
          facebookUrl: "https://facebook.com/barbara.curated",
          googleMapsUrl: "https://maps.app.goo.gl/k5tJ8F2c6y1Q8f3M8",
        },
      });
    }

    return NextResponse.json(contactInfo);
  } catch (error: any) {
    console.error("GET /api/contact error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
