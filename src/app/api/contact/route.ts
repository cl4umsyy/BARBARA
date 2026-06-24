import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 0; // Disable dynamic caching to ensure fresh info

const fallbackContactInfo = {
  id: "contact_info_default",
  storeName: "BARBARA",
  description: "Premium contemporary fashion store. Handpicked quality products for your everyday curated style.",
  address: "Jl. Sunan Kudus No. 100, Kudus, Jawa Tengah 59313, Indonesia",
  whatsapp: "6281234567890",
  email: "contact@barbarastore.com",
  businessHours: "Senin - Minggu, 09.00 - 21.00 WIB",
  instagramUrl: "https://instagram.com/barbara.curated",
  tiktokUrl: "https://tiktok.com/@barbara.curated",
  facebookUrl: "https://facebook.com/barbara.curated",
  googleMapsUrl: "https://maps.app.goo.gl/k5tJ8F2c6y1Q8f3M8",
};

export async function GET() {
  try {
    let contactInfo = null;
    
    try {
      console.log("[GET /api/contact] Querying contact_information table...");
      contactInfo = await prisma.contactInformation.findFirst();
    } catch (dbError: any) {
      console.error("[GET /api/contact] Database error querying contact_information:", dbError.message || dbError);
      if (dbError.stack) {
        console.error("[GET /api/contact] Trace:", dbError.stack);
      }
    }

    if (!contactInfo) {
      // Attempt to save fallback details to DB, but wrap in a try-catch so it won't crash if the table is missing
      try {
        console.log("[GET /api/contact] Table empty or not queried successfully. Attempting to seed default contact info to database...");
        contactInfo = await prisma.contactInformation.create({
          data: fallbackContactInfo,
        });
      } catch (createError: any) {
        console.warn("[GET /api/contact] Failed to save default contact info to database (likely table is missing). Using in-memory fallback:", createError.message || createError);
        contactInfo = fallbackContactInfo;
      }
    }

    return NextResponse.json(contactInfo);
  } catch (error: any) {
    console.error("GET /api/contact fallback error:", error);
    return NextResponse.json(fallbackContactInfo);
  }
}
